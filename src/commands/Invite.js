const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "invite",
            desc: "Get invite links for the bot",
            aliases: [
                "invs",
                "inv"
            ]
        })
    }

    async execute(message) {
        Util.sendMessage(message, {
            embed: {
                description: `**You can invite the bot from one of these sites:**\n• [top.gg](https://top.gg/bot/759415210628087841)\n• [bots.gg](https://discord.bots.gg/bots/759415210628087841)\n• [discordbotlist.com](https://discordbotlist.com/bots/server-stat)\n\n*Upvoting on these sites helps to support the bot*`,
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                color: 5145560,
                footer: Util.getFooter(this.client)
            }
        })
    }
}

module.exports = Command