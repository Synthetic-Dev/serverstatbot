const Discord = require("discord.js")

class CommandBase {
    /**
     * Constructor
     * @param {Discord.Client} client 
     * @param {Object} data 
     */
    constructor(client, data) {
        /**
         * The client that the command exists to
         */
        this.client = client;
        
        /**
         * All the data about the command
         */
        this.data = data;

        if (data.args) {
            let optional = false
            data.args.forEach(arg => {
                if (arg.optional) optional = true;
                else if (optional) throw new Error("Optional argument appeared before required argument")
            })
        }

        /**
         * The description of the command
         */
        this.desc = data.desc ? data.desc : "A Command";
        
        /**
         * If the command is shown
         */
        this.private = data.private ? data.private : false;
        this.secret = data.secret ? data.secret : false
    }

    /**
     * Gets the name of the command
     * @param {boolean} lower 
     * @return {string}
     */
    name(lower = false) {
        let commandName = this.data.name || this.constructor.name
        return lower && commandName.toLowerCase() || commandName
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
     * The method that is executed when the command is ran
     * @param {string[]} inputs 
     * @param {Discord.Message} message 
     */
    async execute(inputs, message) {}
}

module.exports = CommandBase