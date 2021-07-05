const Discord = require("discord.js")

const Util = require("../utils/Util")
const LocaleManager = require("./LocaleManager")

const Base = require("./Base")
//const Types = require("../../typings")

/**
 * Parses the content of a message detects a command and then prompts for the command to be executed
 * @class
 * @extends {Types.Base}
 */
class CommandParser extends Base {
    /**
     * Creates a command parser instance
     * @constructor
     * @param {Discord.Client} client
     * @param {Types.CommandExecutor} executor
     */
    constructor(client, executor) {
        super(client)

        /**
         * The executor used to execute commands
         * @private
         * @type {Types.CommandExecutor}
         */
        this.executor = executor
    }

    /**
     * Parse a message and execute the detected command if required
     * @param {Discord.Message} message
     * @returns {void}
     */
    async parse(message) {
        const guild = message.guild
        const content = message.content
        const author = message.author

        const locale = guild.preferredLocale ?? "en-us"
        const lang = LocaleManager.getLang(locale)
        const settings = this.client.settings[guild.id]
        const prefix = await settings.get("prefix", "Prefix")

        const clientUser = this.client.user

        const mentionStrings = [`<@${clientUser.id}>`, `<@!${clientUser.id}>`]
        const botRole = await Util.getRole(guild, clientUser.username)
        if (botRole) mentionStrings.push(`<@&${botRole.id}>`)
        let firstWord = content.trim().split(" ").shift()
        firstWord = firstWord.substring(0, firstWord.indexOf(">") + 1)
        const isMention = mentionStrings.includes(firstWord)

        const isPrefix = content.startsWith(prefix)
        let command, commandName, inputs

        if (isPrefix || isMention) {
            if (!this.executor.isWithinUsage(author)) {
                const embed = new Discord.MessageEmbed()
                    .setTitle(lang.TOOMANYCOMMANDS)
                    .setDescription(
                        lang.TOOMANYCOMMANDS_DESC.format(
                            Math.round(
                                (commandTimeoutTime -
                                    (Date.now() - commandUsage.lastCommand)) /
                                    1000
                            )
                        )
                    )
                    .setColor(12333616)

                return Util.sendMessage(message, embed)
            }

            if (isMention && content.trim() == firstWord) {
                const embed = new Discord.MessageEmbed()
                    .setTitle(lang.GETTING_STARTED)
                    .setDescription(
                        lang.GETTING_STARTED_DESC.format(
                            prefix,
                            clientUser.username
                        )
                    )
                    .setColor(5145560)
                    .setFooter(Util.getFooter(message).text)
                    .setTimestamp()

                return Util.sendMessage(message, embed)
            }

            ;[commandName, ...inputs] = content
                .trim()
                .substring(
                    isPrefix
                        ? prefix.length
                        : firstWord.length +
                              (content.trim().substr(firstWord.length, 1) == " "
                                  ? 1
                                  : 0)
                )
                .split(" ")
            if (!commandName || commandName.length == 0) return

            if (!this.client.commands)
                return console.error("Commands not loaded")

            command = this.client.commands.get(commandName.toLowerCase())
            if (!command) return

            if (
                !Util.hasPermissionsInChannel(guild.me, message.channel, [
                    "SEND_MESSAGES",
                ])
            )
                return

            if (
                (await this.client.globalSettings.get("Maintenance")) &&
                !Util.isDeveloper(author)
            )
                return Util.replyWarning(message, lang.MAINTENANCE_MODE)

            const disabledCommands = await settings.get(
                "disabledCommands",
                "Commands"
            )
            if (disabledCommands.includes(command.name))
                return Util.replyWarning(message, lang.DISABLED_COMMAND)

            const permissions = command.permissions()
            if (!Util.hasPermissions(message.member, permissions)) {
                return Util.replyWarning(message, lang.NOPERMS)
            }

            if (this.executor.isInTimeout(command, author)) {
                const embed = new Discord.MessageEmbed()
                    .setTitle(lang.COMMANDTIMEOUT)
                    .setDescription(
                        lang.COMMANDTIMEOUT_DESC.format(
                            Math.round(
                                this.getTimeoutLeft(command, author) / 1000
                            )
                        )
                    )
                    .setColor(12333616)

                return Util.sendMessage(message, embed)
            }

            if (inputs.length < command.numOfRequiredArguments()) {
                const helpCommand = this.client.commands.get("help")

                if (inputs.length == 0) {
                    return helpCommand.commandHelp(
                        { prefix: prefix, lang: lang, message: message },
                        command
                    )
                } else if (!command.hasOptionTree()) {
                    return Util.replyError(
                        message,
                        lang.ARGUMENTS_EXPECTED.format(
                            command.name,
                            command.numOfRequiredArguments(),
                            inputs.length
                        )
                    )
                }
            }

            let argumentCount = command.numOfArguments()
            if (
                argumentCount == 0 ||
                !command.arguments()[argumentCount - 1].multiple
            ) {
                argumentCount = Math.min(inputs.length, argumentCount)
                let end = inputs.slice(argumentCount - 1).join(" ")
                inputs = inputs.slice(0, argumentCount - 1)
                inputs[argumentCount - 1] = end
            }

            this.executor.execute(message, command, inputs)
        }
    }
}

module.exports = CommandParser
