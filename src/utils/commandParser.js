const NodeCache = require("node-cache")

const Util = require("./util.js")
const LocaleManager = require("./localeManager.js")

const commandsWithinTimeout = 4;
const commandTimeoutTime = 15*1000;

class Parser {
    constructor(client) {
        this.client = client

        this.commandUsageCache = new NodeCache({
            checkperiod: 300,
            useClones: false
        });
    }

    /**
     * Parse a message and run a command if it passes the parsing
     * @param {*} message 
     * @returns {void}
     */
    async parse(message) {
        const guild = message.guild;
        const content = message.content;
        const author = message.author;

        const locale = guild.preferredLocale ?? "en-us"
        const lang = LocaleManager.getLang(locale)
        const settings = this.client.settings[guild.id];
        const prefix = await settings.get("prefix", "Prefix");

        const clientUser = this.client.user

        const mentionStrings = [`<@${clientUser.id}>`, `<@!${clientUser.id}>`]
        const botRole = await Util.getRole(guild, clientUser.username)
        if (botRole) mentionStrings.push(`<@&${botRole.id}>`);
        let firstWord = content.trim().split(" ").shift()
        firstWord = firstWord.substring(0, firstWord.indexOf(">") + 1)
        const isMention = mentionStrings.includes(firstWord)

        const isPrefix = content.startsWith(prefix);
        let command, commandName, inputs;

        if (isPrefix || isMention) {
            let commandUsage
            if (this.commandUsageCache.has(author.id)) commandUsage = this.commandUsageCache.get(author.id);
            else {
                commandUsage = {lastCommand: Date.now(), consCommands: 0};
                this.commandUsageCache.set(author.id, commandUsage);
            }

            if (commandUsage.consCommands > commandsWithinTimeout && commandUsage.lastCommand + commandTimeoutTime > Date.now()) {
                return Util.sendMessage(message, {
                    embed: {
                        title: lang.TOOMANYCOMMANDS,
                        description: lang.TOOMANYCOMMANDS_DESC.format(Math.round((commandTimeoutTime - (Date.now() - commandUsage.lastCommand)) / 1000)),
                        color: 12333616
                    }
                })
            }

            if (commandUsage.lastCommand + commandTimeoutTime > Date.now()) {
                commandUsage.consCommands++;
            } else {
                commandUsage.consCommands = 0;
            }

            commandUsage.lastCommand = Date.now();
            this.commandUsageCache.ttl(author.id, commandTimeoutTime/1000);

            if (isMention && content.trim() == firstWord) {
                return Util.sendMessage(message, {
                    embed: {
                        title: lang.GETTING_STARTED,
                        description: lang.GETTING_STARTED_DESC.format(prefix, clientUser.username),
                        color: 5145560,
                        timestamp: Date.now(),
                        footer: Util.getFooter(message)
                    }
                })
            }

            [commandName, ...inputs] = content.trim().substring(isPrefix ? prefix.length : firstWord.length + (content.trim().substr(firstWord.length, 1) == " " ? 1 : 0)).split(" ");
            if (!commandName || commandName.length == 0) return;
        
            if (!this.client.commands) return console.error("Commands not loaded");

            if (!Util.hasPermissionsInChannel(guild.me, message.channel, ["SEND_MESSAGES"])) return;

            command = this.client.commands.get(commandName.toLowerCase())
            if (!command) return //Util.couldNotFind(message, "command", commandName);

            if (!command.private && await this.client.globalSettings.get("Maintenance")) return Util.replyWarning(message, lang.MAINTENANCE_MODE);

            const disabledCommands = await settings.get("disabledCommands", "Commands")
            if (disabledCommands.includes(command.name)) return Util.replyWarning(message, lang.DISABLED_COMMAND)

            const permissions = command.permissions()
            if (!Util.hasPermissions(message.member, permissions)) {
                return Util.replyWarning(message, lang.NOPERMS)
            }

            let commandOptions = {message: message, channel: message.channel, guild: guild, author: author, member: message.member, settings: settings, prefix: prefix, lang: lang, locale: locale}

            if (inputs.length < command.numOfRequiredArguments()) {
                const helpCommand = this.client.commands.get("help")

                if (inputs.length == 0) {
                    return helpCommand.commandHelp(commandOptions, command)
                } else if (!command.optionTree) {
                    return Util.replyError(message, lang.ARGUMENTS_EXPECTED.format(command.name, command.numOfRequiredArguments(), inputs.length));
                }
            }

            let argumentCount = command.numOfArguments()
            if (argumentCount == 0 || !command.arguments()[argumentCount - 1].multiple) {
                argumentCount = Math.min(inputs.length, argumentCount)
                let end = inputs.slice(argumentCount - 1).join(" ")
                inputs = inputs.slice(0, argumentCount - 1)
                inputs[argumentCount - 1] = end
            }

            commandOptions.inputs = inputs

            this.client.setImmediate(() => {
                Promise.resolve(command.execute(commandOptions)).catch(e => {
                    Util.replyError(message, lang.ERROR_COMMAND)
                    console.error(e)
                }).finally(() => {
                    this.client.lastCommandTime = Date.now()
                    this.client.commandsProcessed++
                })
            })
        }
    }
}

module.exports = Parser