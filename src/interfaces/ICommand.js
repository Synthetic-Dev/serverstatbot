const discord = require("discord.js")

class ICommand {
    /**
     * Constructor
     * @param {discord.Client} client 
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

        /**
         * The description of the command
         */
        this.desc = data.desc || "A Command";
        
        /**
         * If the command is shown
         */
        this.private = data.private || false;
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
     * Gets the number of arguments that the command takes
     * @return {number}
     */
    numOfArguments() {
        return (this.data.args || []).length
    }

    /**
     * Gets the raw arguments that the command takes
     * @return {Array}
     */
    arguments() {
        return this.data.args || []
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
     * @param {discord.Message} message 
     */
    async execute(inputs, message) {}
}

module.exports = ICommand