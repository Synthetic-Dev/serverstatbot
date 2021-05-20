const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

const LocalSettings = require("../localSettings.json")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "settings",
            descId: "COMMAND_SETTINGS",
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async formatSettings(options, guild) {
        const settings = this.client.settings[guild.id]

        const statuschannel = await settings.get("statuschannel")
        const disabledCommands = await settings.get("disabledCommands", "Commands")
        
        const prefix = await settings.get("prefix", "Prefix")
        const serverData = await settings.get("server");

        let typeIndex = Object.values(LocalSettings.statuschannels.types.ids).indexOf(statuschannel.Type)
        let type = typeIndex >= 0 ? Object.keys(LocalSettings.statuschannels.types.ids)[typeIndex] : null

        const sameGuild = options.guild.id == guild.id

        return options.lang.COMMAND_SETTINGS_FORMAT.format(
            prefix, serverData.Ip, serverData.Port, serverData.QueryPort,
            serverData.Discovery, serverData.DiscoveryInvite != "" ? serverData.DiscoveryInvite : options.lang.NONE,
            (!statuschannel.ChannelId || statuschannel.ChannelId == "0") ? `\`\`${options.lang.NONE}\`\`` : (sameGuild ? `<#${statuschannel.ChannelId}>` : `\`\`${statuschannel.ChannelId}\`\``), type ?? options.lang.UNKNOWN,
            disabledCommands.length > 0 ? disabledCommands.join("``, ``") : options.lang.NONE
        )
    }

    async execute(options) {
        Util.sendMessage(options.message, {
            embed: {
                title: options.lang.COMMAND_SETTINGS_TITLE,
                description: await this.formatSettings(options, options.guild),
                color: 16760391,
                timestamp: Date.now(),
                footer: Util.getFooter(options.message)
            }
        }).catch(e => {
            console.error(`Settings[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command