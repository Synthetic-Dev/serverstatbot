const Discord = require("discord.js")
const Util = require("../utils/util.js")

class CommandBase {
    /**
     * Constructor
     * @param {Discord.Client} client 
     * @param {{name?: string, descId?: string, args: string<{name: string, descId?: string, optional?: boolean, multiple?: boolean}>}, private} data 
     */
    constructor(client, data) {
        this.client = client;
        this.data = data;

        if (data.args) {
            let optional = false
            data.args.forEach((arg, index) => {
                if (arg.multiple && index != data.args.length - 1) throw new Error("Multiple argument appeared before end of arguments") 

                if (arg.optional) optional = true;
                else if (optional) throw new Error("Optional argument appeared before required argument")
            })
        }

        this.name = (data.name || this.constructor.name).toLowerCase()
        this.descId = data.descId ?? "COMMAND_BASE"
        this.timeout = data.timeout ?? null
        
        this.private = data.private ?? false;

        this.optionTree = data.optionTree
        this.optionTreeFuncs = {}

        if (this.optionTree) {
            function verify(tree) {
                tree._extends = false
                Object.keys(tree).forEach(key => {
                    if (key.startsWith("_")) return;
                    tree._extends = true
                    const lowerKey = key.toLowerCase()
                    let value = tree[key]
                    if (lowerKey != key) {
                        tree[lowerKey] = value
                        delete tree[key]
                    }
                    if (value == false) {
                        if (tree._hasVarient) throw new Error("Cannot have more than 1 varient option in a branch")
                        tree._hasVarient = true
                    } else if (typeof value == "object") {
                        if (value._value == false) {
                            if (tree._hasVarient) throw new Error("Cannot have more than 1 varient option in a branch")
                            tree._hasVarient = true
                            tree._varientKey = key
                        }
                        if (value._aliases && value._aliases.length > 0) {
                            tree._linkedAliases = tree._linkedAliases ?? {}
                            value._aliases.forEach(alias => {
                                if (tree._linkedAliases[alias]) throw new Error("Cannot have more than 1 options with the same alias in a branch")
                                tree._linkedAliases[alias] = key
                            })
                        }
                        if (tree._optional) value._optional = true;
                        verify(value)
                    }
                })
            }
            verify(this.optionTree)
        }
    }


    /**
     * Gets the aliases of the command
     * @return {Array}
     */
    aliases() {
        return this.data.aliases || []
    }

    /**
     * Gets the raw arguments that the command takes
     * @return {Array}
     */
    arguments() {
        return this.data.args || []
    }

    /**
     * Gets the raw number of arguments that the command takes
     * @return {number}
     */
    numOfArguments() {
        return this.arguments().length
    }

    /**
     * Gets the required arguments that the command takes
     */
    requiredArguments() {
        let args = []
        this.arguments().forEach(arg => {
            if (!arg.optional) args.push(arg);
        })
        return args
    }

    /**
     * Gets the number of required arguments that the command takes
     * @return {number}
     */
    numOfRequiredArguments() {
        return this.requiredArguments().length
    }

    /**
     * Gets the permissions that the command needs
     * @return {Array}
     */
    permissions() {
        return this.data.perms || []
    }


    /**
     * Gets the tags assigned to the command
     * @return {Array}
     */
    tags() {
        return this.data.tags || []
    }
    
    /**
     * Checks if command has a tag
     * @param {string} tagName
     * @return {Array}
     */
    hasTag(tagName) {
        const tags = this.tags()
        return tags.includes(tagName)
    }


    hasOptionTree() {
        return this.optionTree != null
    }

    getOptionPath(optionPath) {
        if (!this.optionTree) return null;
        let options = optionPath.trim().toLowerCase().split(".")
        let tree = this.optionTree
        options.forEach(option => {
            if (!tree) return;
            tree = tree[option]
        })
        return tree
    }

    setOptionFunc(optionPath, func, direct = false) {
        optionPath = optionPath.toLowerCase()

        const parentPath = optionPath.split(".").slice(0, -1)
        let parentTree = this.getOptionPath(parentPath.join("."))
        if (parentTree == null) parentTree = this.optionTree;

        const tree = this.getOptionPath(optionPath)
        if (tree != null) {
            if (typeof tree == "boolean") {
                if (tree) {
                    this.optionTreeFuncs[optionPath] = func
                } else {
                    parentTree._varient = func
                }
            } else if (typeof tree == "object") {
                if (direct) {
                    if (!tree._optional && tree._value != false) throw new Error(`'${optionPath}' has required options or is not varient`)
                    if (tree._value == false) parentTree._varient = func;
                    else this.optionTreeFuncs[optionPath] = func;
                } else {
                    if (!tree._extends) this.optionTreeFuncs[optionPath] = func;
                    else {
                        let dive = (branch) => {
                            Object.keys(branch).forEach(key => {
                                if (key.startsWith("_")) return;
                                let value = branch[key]
                                if (typeof value == "boolean") {
                                    if (value) this.optionTreeFuncs[`${optionPath}.${key}`] = func;
                                    else branch._varient = func;
                                } else if (typeof value == "object") {
                                    if (value._value == false) branch._varient = func;
                                    if (value._hasVarient) dive(value);
                                }
                            })
                        }
                        dive(tree)
                    }
                }
            } else throw new Error(`'${optionPath}' is not a boolean or a branch`);
        } else throw new Error(`'${optionPath}' is not a valid option path`);
    }

    /**
     * A method to be ran in the execute method if using an optionTree
     * @param {{message: Discord.Message, inputs?: string[], lang: Object<string, string>}} options 
     */
    executeOptionTree(options) {
        let path = []
        let exec = false
        let end = false

        let branchPath = [this.optionTree]
        let branch
        let values = []
        options.inputs.forEach((input, index) => {
            if (exec || end) return;

            let previousBranch = branchPath[branchPath.length - 1]
            if (previousBranch == null) return;

            let last = index == options.inputs.length - 1
            path.push(input)
            let optionPath = path.join(".")
            branch = this.getOptionPath(optionPath)
            if (!branch && previousBranch._linkedAliases) {
                let link = previousBranch._linkedAliases[input]
                if (link) {
                    path.pop()
                    path.push(link)
                    optionPath = path.join(".")
                    branch = this.getOptionPath(optionPath)
                }
            }

            let func
            if (branch == true || (typeof branch == "object" && last && (branch._optional || !branch._extends))) {
                func = this.optionTreeFuncs[optionPath]
                end = true
            } else if (!branch && typeof previousBranch == "object" && previousBranch._hasVarient) {
                branch = previousBranch[previousBranch._varientKey]
                values.push(input)
                if (!branch) {
                    func = previousBranch._varient
                }
                if (func) end = true;
            } else if (!branch) {
                if (input == "*") {
                    Util.sendMessage(options.message, options.lang.OPTIONS_LIST.format(Object.keys(previousBranch).filter(key => !key.startsWith("_")).join("``, ``")))
                } else {
                    Util.replyError(options.message, options.lang.OPTIONS_UNEXPECTED_INPUT.format(input, Object.keys(previousBranch).filter(key => !key.startsWith("_")).join("``, ``")))
                }
            }

            branchPath.push(branch)

            if (end) {
                if (values.length == 0) values.push(input);
                if (func) {
                    func.call(this, options, values.length > 1 ? values : values.shift(), index)
                    exec = true
                } else {
                    Util.replyError(options.message, options.lang.OPTIONS_NOT_IMPLEMENTED)
                }
            }

            previousBranch = branch
        })

        if (!exec) {
            if (branch && (!branch._optional || !branch._extends)) {
                Util.replyError(options.message, options.lang.OPTIONS_EXPECTED_INPUT.format(Object.keys(branch).filter(key => !key.startsWith("_")).join("``, ``")))
            }
        }
    }

    
    /**
     * The method that is executed when the command is ran
     * @param {{message: Discord.Message, inputs?: string[], lang: Object<string, string>}} options 
     */
    async execute(options) {}
}

module.exports = CommandBase