const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "about",
            desc: "Information about the bot",
            aliases: [
                "abt"
            ]
        })
    }

    async execute(message) {
        Util.sendMessage(message, {
            embed: {
                title: "About",
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                color: 5145560,
                fields: [
                    {
                        name: "Version",
                        value: process.env.npm_package_version,
                        inline: true
                    },
                    {
                        name: "Developed by",
                        value: "SyntheticDev",
                        inline: true
                    },
                    {
                        name: "Credit to",
                        value: "[mc-heads.net](https://mc-heads.net/)",
                        inline: true
                    },
                    {
                        name: "Servers",
                        value: this.client.guilds.cache.size,
                        inline: true
                    },
                    {
                        name: "Library",
                        value: `[discord.js](https://discord.js.org/)`,
                        inline: true
                    },
                    {
                        name: "Support",
                        value: "[Join support server](https://discord.gg/uqVp2XzUP8)",
                        inline: true
                    }
                ],
                footer: Util.getFooter(this.client)
            }
        })
    }
}

module.exports = Command