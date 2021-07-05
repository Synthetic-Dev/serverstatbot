const Discord = require("discord.js")
const NodeCache = require("node-cache")

const Util = require("../utils/Util")
const LocaleManager = require("./LocaleManager")

const Base = require("./Base")
//const Types = require("../../typings")

const commandsWithinTimeout = 4
const commandTimeoutTime = 15 * 1000

/**
 * Manages execution of commands
 * @class
 * @extends {Types.Base}
 */
class CommandExecutor extends Base {
    /**
     * Creates a command executor instance
     * @constructor
     * @param {Discord.Client} client
     */
    constructor(client) {
        super(client)

        /**
         * The cache used to store consecutive command usage
         * @private
         * @type {NodeCache}
         */
        this.commandUsageCache = new NodeCache({
            checkperiod: 300,
            useClones: false,
        })

        /**
         * The cache used to user command timeouts
         * @private
         * @type {NodeCache}
         */
        this.commandTimeoutCache = new NodeCache({
            checkperiod: 120,
            useClones: false,
        })
    }

    /**
     * Check if the user hasn't been spamming commands
     * @param {Discord.User} user
     * @returns {boolean}
     */
    isWithinUsage(user) {
        if (user.bot) return true

        let commandUsage
        if (this.commandUsageCache.has(user.id))
            commandUsage = this.commandUsageCache.get(user.id)
        else {
            commandUsage = { lastCommand: Date.now(), consCommands: 0 }
            this.commandUsageCache.set(user.id, commandUsage)
        }

        if (
            commandUsage.consCommands > commandsWithinTimeout &&
            commandUsage.lastCommand + commandTimeoutTime > Date.now()
        )
            return false

        if (commandUsage.lastCommand + commandTimeoutTime > Date.now()) {
            commandUsage.consCommands++
        } else {
            commandUsage.consCommands = 0
        }

        commandUsage.lastCommand = Date.now()
        this.commandUsageCache.ttl(user.id, commandTimeoutTime / 1000)

        return true
    }

    /**
     * Get the cache key for timeouts
     * @private
     * @param {Types.CommandBase} command
     * @param {Discord.User} user
     * @returns {string}
     */
    getTimeoutKey(command, user) {
        return `${user.id}-${command.name}`
    }

    /**
     * Get how much time is left before the command can be ran by the user again
     * @param {Types.CommandBase} command
     * @param {Discord.User} user
     * @returns {number} milliseconds
     */
    getTimeoutLeft(command, user) {
        const commandTimeoutKey = this.getTimeoutKey(command, user)
        let nextTime = this.commandTimeoutCache.get(commandTimeoutKey)
        return nextTime ? nextTime - Date.now() : 0
    }

    /**
     * Check if the user ran the command within the commands timeout (if it has one)
     * @param {Types.CommandBase} command
     * @param {Discord.User} user
     * @returns {boolean}
     */
    isInTimeout(command, user) {
        const commandTimeoutKey = this.getTimeoutKey(command, user)
        if (this.commandTimeoutCache.has(commandTimeoutKey)) {
            if (this.getTimeoutLeft(command, user) > 0) {
                return true
            } else {
                this.commandTimeoutCache.del(commandTimeoutKey)
            }
        }
        return false
    }

    /**
     * Execute a command with the given parent message and inputs
     * @param {Discord.Message} message
     * @param {Types.CommandBase} command
     * @param {string[]} inputs
     * @returns {void}
     */
    async execute(message, command, inputs = []) {
        const guild = message.guild
        const author = message.author

        const locale = guild.preferredLocale ?? "en-us"
        const lang = LocaleManager.getLang(locale)
        const settings = this.client.settings[guild.id]
        const prefix = await settings.get("prefix", "Prefix")

        let commandOptions = {
            client: this.client,

            message: message,
            channel: message.channel,
            guild: guild,

            author: author,
            member: message.member,

            inputs: inputs,

            settings: settings,
            prefix: prefix,

            lang: lang,
            locale: locale,
        }

        if (command.timeout) {
            const commandTimeoutKey = this.getTimeoutKey(command, author)
            this.commandTimeoutCache.set(
                commandTimeoutKey,
                Date.now() + command.timeout
            )
        }

        this.client.setImmediate(() => {
            Promise.resolve(command.execute(commandOptions))
                .catch((e) => {
                    Util.replyError(message, lang.ERROR_COMMAND)
                    Util.error(e, "CommandExecutor", "executeCommand")
                })
                .finally(() => {
                    this.client.lastCommandTime = Date.now()
                    this.client.commandsProcessed++
                })
        })
    }
}

module.exports = CommandExecutor
