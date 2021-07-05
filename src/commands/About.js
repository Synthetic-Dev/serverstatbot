const Discord = require("discord.js")
const { MessageButton, MessageActionRow } = require("discord-buttons")

const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "about",
            descId: "COMMAND_ABOUT",
            aliases: ["version", "abt"],
        })
    }

    async execute(options) {
        const embed = new Discord.MessageEmbed()
            .setTitle(options.lang.COMMAND_ABOUT_TITLE)
            .setColor(5145560)
            .setAuthor(
                this.client.user.username,
                this.client.user.avatarURL({
                    size: 64,
                    dynamic: true,
                    format: "png",
                })
            )
            .addFields(
                {
                    name: options.lang.COMMAND_ABOUT_FIELD1,
                    value: process.env.npm_package_version,
                    inline: true,
                },
                {
                    name: options.lang.COMMAND_ABOUT_FIELD2,
                    value: this.client.guilds.cache.size,
                    inline: true,
                },
                {
                    name: options.lang.COMMAND_ABOUT_FIELD3,
                    value: "SyntheticDev",
                    inline: true,
                }
            )
            .setFooter(Util.getFooter(options.message).text)
            .setTimestamp()

        let supportButton = new MessageButton()
            .setStyle("url")
            .setLabel(options.lang.COMMAND_ABOUT_BUTTON1)
            .setURL("https://discord.gg/uqVp2XzUP8")

        let libraryButton = new MessageButton()
            .setStyle("url")
            .setLabel(options.lang.COMMAND_ABOUT_BUTTON2.format("discord.js"))
            .setURL("https://discord.js.org/")

        Util.sendMessage(options.message, {
            embed: embed,
            component: new MessageActionRow().addComponents(
                supportButton,
                libraryButton
            ),
        }).catch((e) => {
            Util.error(e, "About", "sendMessage")
        })
    }
}

module.exports = Command
