const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "about",
            descId: "COMMAND_ABOUT",
            aliases: [
                "version",
                "abt"
            ]
        })
    }

    async execute(options) {
        Util.sendMessage(options.message, {
            embed: {
                title: options.lang.COMMAND_ABOUT_TITLE,
                color: 5145560,
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                fields: [
                    {
                        name: options.lang.COMMAND_ABOUT_FIELD1,
                        value: process.env.npm_package_version,
                        inline: true
                    },
                    {
                        name: options.lang.COMMAND_ABOUT_FIELD2,
                        value: "SyntheticDev",
                        inline: true
                    },
                    {
                        name: options.lang.COMMAND_ABOUT_FIELD3,
                        value: "[mc-heads.net](https://mc-heads.net/)",
                        inline: true
                    },
                    {
                        name: options.lang.COMMAND_ABOUT_FIELD4,
                        value: this.client.guilds.cache.size,
                        inline: true
                    },
                    {
                        name: options.lang.COMMAND_ABOUT_FIELD5,
                        value: `[discord.js](https://discord.js.org/)`,
                        inline: true
                    },
                    {
                        name: options.lang.COMMAND_ABOUT_FIELD6,
                        value: `[${options.lang.COMMAND_ABOUT_FIELD6_VAL}](https://discord.gg/uqVp2XzUP8)`,
                        inline: true
                    }
                ],
                timestamp: Date.now(),
                footer: Util.getFooter(options.message)
            }
        }).catch(e => {
            console.error(`About[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command