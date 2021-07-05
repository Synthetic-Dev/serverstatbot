const Discord = require("discord.js")
const { MessageButton, MessageActionRow } = require("discord-buttons")

const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "welcome",
            descId: "COMMAND_DEV_WELCOME",
            perms: ["DEV"],
            private: true,
        })
    }

    sendWelcome(client, channel, lang, prefix) {
        const embed = new Discord.MessageEmbed()
            .setTitle(lang.GUILD_JOIN_THANKS.format(client.user.username))
            .setDescription(
                lang.GUILD_JOIN_DESC.format(prefix, client.user.username)
            )
            .setColor(5145560)
            .setAuthor(
                client.user.username,
                client.user.avatarURL({
                    size: 64,
                    dynamic: true,
                    format: "png",
                })
            )
            .setFooter(
                `${client.user.username} | ${process.env.npm_package_version}`
            )
            .setTimestamp()

        const setupButton = new MessageButton()
            .setStyle("blurple")
            .setLabel("Setup")
            .setEmoji(Util.getEmoji(this.client, "gear"))
            .setID("send_setup")

        const row = new MessageActionRow().addComponent(setupButton)

        let content = { embed: embed, component: row }

        Util.sendMessage(channel, content)
            .then((botMessage) => {
                if (
                    !botMessage ||
                    botMessage.channel instanceof Discord.DMChannel
                )
                    return

                if (!botMessage || botMessage.deleted) return
                let collector = botMessage.createButtonCollector(
                    (button) =>
                        Util.hasPermissions(button.clicker.member, [
                            "ADMINISTRATOR",
                        ]),
                    { time: 240 * 1000, dispose: true }
                )

                collector.on("collect", (button) => {
                    if (!botMessage || botMessage.deleted)
                        return collector.stop()

                    button.reply.defer()

                    const setupCommand = client.commands.get("setup")
                    setupCommand.sendSetup({
                        channel: channel,
                        author: button.clicker.user,
                        lang: lang,
                        prefix: prefix,
                    })
                })

                collector.on("end", async () => {
                    if (!botMessage || botMessage.deleted) return

                    content.component.components.forEach((button) => {
                        button.setDisabled(true)
                    })

                    botMessage.edit(content).catch((e) => {
                        Util.error(e, "WelcomeMessage", "editMessage")
                    })
                })
            })
            .catch((e) => {
                Util.error(e, "WelcomeMessage", "sendMessage")
            })
    }

    async execute(options) {
        this.sendWelcome(
            this.client,
            options.channel,
            options.lang,
            options.prefix
        )
    }
}

module.exports = Command
