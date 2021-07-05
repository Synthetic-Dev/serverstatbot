const Discord = require("discord.js")

const Util = require("../utils/Util")

const CommandBase = require("../classes/CommandBase")
const MessagePages = require("../classes/MessagePages")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "help",
            descId: "COMMAND_HELP",
            aliases: ["cmds"],
            args: [
                {
                    name: "command",
                    descId: "COMMAND_HELP_ARG1",
                    optional: true,
                },
                {
                    name: "arguments",
                    optional: true,
                    multiple: true,
                },
            ],
        })
    }

    /**
     * Post a formatted commands message
     * @param {Object} options
     * @param {CommandBase[]} commands
     * @param {string} desc
     * @param {Array} fields
     */
    async postCommands(options, commands, desc = "", color = 5145560) {
        let disabledCommands = await options.settings.get(
            "disabledCommands",
            "Commands"
        )

        let mobileVersion = Util.isOnMobile(options.author)

        let pages = new MessagePages()
        let commandsPerPage = 15
        for (let i = 0; i < Math.ceil(commands.length / commandsPerPage); i++) {
            let fields = [
                {
                    name: options.lang.COMMAND_HELP_FIELD1,
                    value: "",
                    inline: true,
                },
                {
                    name: options.lang.COMMAND_HELP_FIELD2,
                    value: "",
                    inline: true,
                },
            ]

            if (mobileVersion) {
                fields.pop()
                fields[0].name += ` | ${options.lang.COMMAND_HELP_FIELD2}`
            }

            const truncateLength = mobileVersion ? 30 : 55
            commands.forEach((command, index) => {
                if (
                    index < commandsPerPage * i ||
                    index >= commandsPerPage * (i + 1)
                )
                    return
                let disabled = disabledCommands.includes(command.name)
                fields[0].value += disabled
                    ? `:lock: ~~${command.name}~~`
                    : command.permissions().includes("DEV")
                    ? `:closed_lock_with_key: **${command.name}**`
                    : `:white_small_square: **${command.name}**`
                let desc = `- ${
                    options.lang[command.descId].slice(0, truncateLength) +
                    (options.lang[command.descId].length > truncateLength
                        ? ".."
                        : "")
                }`
                if (mobileVersion) fields[0].value += " " + desc
                else fields[1].value += desc + "\n"

                fields[0].value += "\n"
            })

            let footer = Util.getFooter(options.message, false)
            if (mobileVersion)
                footer.text = options.lang.MOBILE + " | " + footer.text

            const embed = new Discord.MessageEmbed()
                .setTitle(options.lang.COMMANDS)
                .setDescription(
                    `**${options.lang.PREFIX}: \`${options.prefix}\`**${desc}`
                )
                .setColor(color)
                .addFields(fields)
                .setFooter(footer.text)
                .setTimestamp()

            pages.addPage(embed)
        }

        pages.send(options.channel, options.author)
    }

    /**
     * Get list of commands following check
     * @param {Discord.Collection} commands
     * @param {Function} check
     * @returns {CommandBase[]}
     */
    getCommands(commands, check) {
        let newCommands = []

        commands.forEach((command) => {
            if ((check && check(command)) || !check) {
                if (newCommands.includes(command)) return
                newCommands.push(command)
            }
        })

        return newCommands
    }

    /**
     * Post embed containing command info
     * @param {Discord.Message} message
     * @param {CommandBase} command
     */
    async commandHelp(options, command, inputs = []) {
        let scommand = [`${options.prefix}${command.name}`]
        let args = ""

        if (command.numOfArguments() > 0) {
            command.arguments().forEach((arg, i) => {
                if (i < inputs.length) {
                    scommand.push(`\`${inputs[i]}\``)
                } else {
                    let formatted = `${arg.multiple ? "..." : ""}${arg.name}`
                    if (arg.optional) formatted = `\`[${formatted}]\``
                    else formatted = `\`<${formatted}>\``
                    scommand.push(formatted)
                    if (options.lang[arg.descId])
                        args += `• ${formatted} - ${options.lang[arg.descId]}\n`
                }
            })
        }

        let opts = ""
        let descId = command.descId

        if (command.hasOptionTree()) {
            function iterOptions(tree, string, iterIndex = 0) {
                Object.keys(tree).forEach((key) => {
                    if (key.startsWith("_")) return
                    let str = string ?? `• ${options.prefix}${command.name}`
                    let value = tree[key]
                    let optional = tree._optional
                    const isObject = typeof value == "object"
                    const hasAlias =
                        isObject && value._aliases && value._aliases.length > 0

                    const input = inputs[iterIndex]
                    if (value == false || (isObject && value._value == false)) {
                        str += optional
                            ? ` \`[${
                                  key +
                                  (hasAlias
                                      ? ` | ${value._aliases.join(" | ")}`
                                      : "")
                              }]\``
                            : ` \`<${
                                  key +
                                  (hasAlias
                                      ? ` | ${value._aliases.join(" | ")}`
                                      : "")
                              }>\``
                    } else {
                        if (input) {
                            if (key.toLowerCase() != input.toLowerCase()) return
                            str += ` \`${input}\``
                        } else {
                            str += optional
                                ? ` \`${
                                      key +
                                      (hasAlias
                                          ? ` | ${value._aliases.join(" | ")}`
                                          : "")
                                  }?\``
                                : ` \`${
                                      key +
                                      (hasAlias
                                          ? ` | ${value._aliases.join(" | ")}`
                                          : "")
                                  }\``
                        }
                    }

                    iterIndex++

                    if (isObject) {
                        optional = value._optional
                        if (value._shortname) {
                            let subOptions = Object.values(value).filter(
                                (v) => typeof v == "boolean"
                            )
                            let subTree = {}
                            Object.keys(value).forEach((k) => {
                                let v = value[k]
                                if (typeof v == "object") {
                                    subTree[k] = v
                                }
                            })
                            let subBranches = Object.values(subTree)
                            let shortStr = optional
                                ? ` \`[*${value._shortname}]\``
                                : ` \`<*${value._shortname}>\``
                            if (input) shortStr = ""

                            if (subBranches.length > 0) {
                                if (subOptions.length == 0) {
                                    str += shortStr
                                    subBranches.forEach((v) => {
                                        iterOptions(v, str, iterIndex)
                                    })
                                } else {
                                    iterOptions(subTree, str, iterIndex)
                                }
                            }
                            if (subOptions.length > 0) {
                                str += shortStr
                                opts += `${str}\n`
                            }
                        } else if (!value._extends) {
                            opts += `${str}\n`
                        } else iterOptions(value, str, iterIndex)
                    } else if (typeof value === "boolean") {
                        opts += `${str}\n`
                    }
                })
            }
            iterOptions(command.getOptionTree())
        }

        args = args.trim()

        const embed = new Discord.MessageEmbed()
            .setTitle(scommand.join(" "))
            .setDescription(
                `**${options.lang.COMMAND_HELP_HEADER1}:** ${options.lang[descId]}\n` +
                    (command.aliases().length > 0
                        ? `**${options.lang.COMMAND_HELP_HEADER2}:** ${command
                              .aliases()
                              .join(", ")}\n`
                        : "") +
                    `**${options.lang.COMMAND_HELP_HEADER3}:**${
                        args.length > 0 ? `\n${args}` : " " + options.lang.NONE
                    }` +
                    (command.hasOptionTree()
                        ? `\n**${
                              options.lang.COMMAND_HELP_HEADER4
                          }:**\n${opts.trim()}`
                        : "")
            )
            .setColor(12333616)
            .setTimestamp()

        Util.replyMessage(options.message, embed).catch((e) => {
            Util.error(e, "Help", "replyMessage")
        })
    }

    async execute(options) {
        if (options.inputs[0]) {
            const commandName = options.inputs.shift()
            const command = this.client.commands.get(commandName.toLowerCase())
            if (!command)
                return Util.couldNotFind(
                    options.message,
                    "command",
                    commandName
                )
            if (!Util.hasPermissions(options.member, command.permissions()))
                return Util.replyWarning(options.message, options.lang.NOPERMS)
            return this.commandHelp(options, command, options.inputs)
        }

        let commands = this.getCommands(this.client.commands, (command) => {
            const permissions = command.permissions()
            return (
                command != this &&
                !command.private &&
                Util.hasPermissions(options.member, permissions)
            )
        })

        let mobileVersion = Util.isOnMobile(options.author)
        this.postCommands(
            options,
            commands,
            `\n${"<:white_bar:832687844131602452>".repeat(
                mobileVersion ? 20 : 27
            )}\n${options.lang.COMMAND_HELP_DETAILS.format(options.prefix)}`
        )
    }
}

module.exports = Command
