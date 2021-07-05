const Discord = require("discord.js")
const { MessageButton } = require("discord-buttons")

const Util = require("../utils/Util")

const CommandBase = require("../classes/CommandBase")
const ButtonInputManager = require("../classes/ButtonInputManager")

const LocalSettings = require("../localSettings.json")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "settings",
            descId: "COMMAND_SETTINGS",
            perms: ["ADMINISTRATOR"],
        })
    }

    async formatSettings(options, guild) {
        const settings = this.client.settings[guild.id]

        const statuschannel = await settings.get("statuschannel")
        const disabledCommands = await settings.get(
            "disabledCommands",
            "Commands"
        )

        const prefix = await settings.get("prefix", "Prefix")
        const serverData = await settings.get("server")

        let typeIndex = Object.values(
            LocalSettings.statuschannels.types.ids
        ).indexOf(statuschannel.Type)
        let type =
            typeIndex >= 0
                ? Object.keys(LocalSettings.statuschannels.types.ids)[typeIndex]
                : null

        const sameGuild = options.guild.id == guild.id

        return options.lang.COMMAND_SETTINGS_FORMAT.format(
            prefix,
            serverData.Ip,
            serverData.Port,
            serverData.QueryPort,
            serverData.Discovery,
            serverData.DiscoveryInvite != ""
                ? serverData.DiscoveryInvite
                : options.lang.NONE,
            !statuschannel.ChannelId || statuschannel.ChannelId == "0"
                ? `\`${options.lang.NONE}\``
                : sameGuild
                ? `<#${statuschannel.ChannelId}>`
                : `\`${statuschannel.ChannelId}\``,
            type ?? options.lang.UNKNOWN,
            disabledCommands.length > 0
                ? disabledCommands.join("``, ``")
                : options.lang.NONE
        )
    }

    async execute(options) {
        const embed = new Discord.MessageEmbed()
            .setTitle(options.lang.COMMAND_SETTINGS_TITLE)
            .setDescription(await this.formatSettings(options, options.guild))
            .setColor(16760391)
            .setFooter(Util.getFooter(options.message).text)
            .setTimestamp()

        const resetButton = new MessageButton()
            .setStyle("red")
            .setLabel("Reset")
            .setID("settings_reset")
            .setDisabled(!Util.hasPermissions(options.member, ["OWNER"]))

        Util.sendMessage(options.message, {
            embed: embed,
            component: resetButton,
        })
            .then((message) => {
                const filter = (menu) =>
                    menu.clicker.user.id == options.author.id
                const manager = new ButtonInputManager(message, filter)
                    .start()
                    .on("input", async (button) => {
                        if (button.id == "settings_reset") {
                            options.settings.clear()
                            button.reply.send(
                                options.lang.COMMAND_RESETSETTINGS_CONTENT,
                                { ephemeral: true }
                            )

                            embed.setDescription(
                                await this.formatSettings(
                                    options,
                                    options.guild
                                )
                            )

                            message.edit(embed).catch((e) => {
                                Util.error(e, "Settings", "editMessage")
                            })
                        } else button.reply.defer()
                    })
            })
            .catch((e) => {
                Util.error(e, "Settings", "sendMessage")
            })
    }
}

module.exports = Command
