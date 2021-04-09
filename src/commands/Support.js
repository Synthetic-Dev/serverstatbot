const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "support",
            desc: "Support info for the bot",
            aliases: [
                "suprt",
                "spt"
            ]
        })
    }

    async execute(message) {
        Util.sendMessage(message, {
            embed: {
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
                        name: "Donate",
                        value: "[Help support by donating](https://donatebot.io/checkout/797779595852120064)",
                        inline: true
                    },
                    {
                        name: "Support server",
                        value: "[Join support server](https://discord.gg/uqVp2XzUP8)",
                        inline: true
                    },
                    {
                        name: "Supported Minecraft Versions",
                        value: `Java ${Protocol.getMinSupportedVersion()}+ and all official Bedrock versions`
                    }
                ],
                timestamp: Date.now(),
                footer: Util.getFooter(this.client)
            }
        }).catch(e => {
            console.error(`Support[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command