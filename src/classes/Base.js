const Discord = require("discord.js")

/**
 * The base class for all things that require the discord client
 * @class
 */
class Base {
    /**
     * Creates a base instance
     * @constructor
     * @param {Discord.Client} client
     */
    constructor(client) {
        /**
         * The discord client used in this instance
         * @readonly
         * @type {Discord.Client}
         */
        this.client = client
    }

    /**
     * Get the client used by this instance
     * @returns {Discord.Client}
     */
    getClient() {
        return this.client
    }
}

module.exports = Base
