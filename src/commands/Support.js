const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
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
                        name: "Support the bot",
                        value: "**[Donate](https://www.paypal.com/donate?hosted_button_id=F9CPBU97FFXYU)**",
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
                footer: Util.getFooter(this.client)
            }
        })
    }
}

module.exports = Command