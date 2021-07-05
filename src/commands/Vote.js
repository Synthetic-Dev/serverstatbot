const Discord = require("discord.js")
const {
    MessageMenu,
    MessageMenuOption,
    MessageButton,
    MessageActionRow,
} = require("discord-buttons")

const Util = require("../utils/Util")

const CommandBase = require("../classes/CommandBase")
const MenuInputManager = require("../classes/MenuInputManager")

const LocalSettings = require("../localSettings.json")

const emojis = [":blush:", ":sunglasses:", ":star_struck:", ":partying_face:"]

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "vote",
            descId: "COMMAND_VOTE",
            aliases: ["rate", "upvote", "votes"],
        })
    }

    async execute(options) {
        const votes = new MessageMenu()
            .setID("votes")
            .setMinValues(0)
            .setMaxValues(1)
            .setPlaceholder("Select a site")

        LocalSettings.botsites.forEach((site) => {
            if (!site.vote && !site.rate) return

            const vote = new MessageMenuOption()
                .setValue(site.main)
                .setLabel(site.hostname)

            votes.addOption(vote)
        })

        const embed = new Discord.MessageEmbed()
            .setDescription(options.lang.COMMAND_VOTE_DESC)
            .setColor(5145560)
            .setAuthor(
                this.client.user.username,
                this.client.user.avatarURL({
                    size: 64,
                    dynamic: true,
                    format: "png",
                })
            )

        Util.sendMessage(options.message, embed, votes)
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

                        const row = new MessageActionRow()

                        if (site.vote) {
                            row.addComponent(
                                new MessageButton()
                                    .setStyle("url")
                                    .setLabel("Vote")
                                    .setURL(site.main)
                            )
                        }

                        if (site.rate) {
                            row.addComponent(
                                new MessageButton()
                                    .setStyle("url")
                                    .setLabel("Rate")
                                    .setURL(site.rate)
                            )
                        }

                        const opts = {
                            ephemeral: true,
                            components: row,
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
                Util.error(e, "Vote", "sendMessage")
            })
    }
}

module.exports = Command
