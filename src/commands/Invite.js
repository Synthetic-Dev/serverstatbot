const Discord = require("discord.js")
const {
    MessageMenu,
    MessageMenuOption,
    MessageButton,
} = require("discord-buttons")

const Util = require("../utils/Util")

const CommandBase = require("../classes/CommandBase")
const MenuInputManager = require("../classes/MenuInputManager")

const LocalSettings = require("../localSettings.json")

const emojis = [":blush:", ":sunglasses:", ":star_struck:", ":partying_face:"]

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "invite",
            descId: "COMMAND_INVITE",
            aliases: ["invites", "invs", "inv"],
        })
    }

    async execute(options) {
        const invites = new MessageMenu()
            .setID("invites")
            .setMinValues(0)
            .setMaxValues(1)
            .setPlaceholder("Select a site")

        LocalSettings.botsites.forEach((site) => {
            const invite = new MessageMenuOption()
                .setValue(site.main)
                .setLabel(site.hostname)

            invites.addOption(invite)
        })

        const embed = new Discord.MessageEmbed()
            .setDescription(
                options.lang.COMMAND_INVITE_DESC.format(options.prefix)
            )
            .setColor(5145560)
            .setAuthor(
                this.client.user.username,
                this.client.user.avatarURL({
                    size: 64,
                    dynamic: true,
                    format: "png",
                })
            )

        Util.sendMessage(options.message, embed, invites)
            .then((message) => {
                let component

                const filter = (menu) =>
                    menu.clicker.user.id == options.author.id
                const manager = new MenuInputManager(message, filter)
                    .start()
                    .on("input", (menu) => {
                        let sites = LocalSettings.botsites.filter(
                            (s) => s.main == menu.values[0]
                        )
                        if (sites.length == 0) return menu.reply.defer()
                        let site = sites.shift()

                        const button = new MessageButton()
                            .setStyle("url")
                            .setLabel("Invite")
                            .setURL(site.main)

                        const opts = {
                            ephemeral: true,
                            component: button,
                        }
                        const emoji =
                            emojis[
                                Math.round(Math.random() * (emojis.length - 1))
                            ]

                        if (component) {
                            component.reply.edit(emoji, opts)
                            menu.reply.defer()
                        } else {
                            component = menu
                            component.reply.send(emoji, opts)
                        }
                    })
            })
            .catch((e) => {
                Util.error(e, "Invite", "sendMessage")
            })
    }
}

module.exports = Command
