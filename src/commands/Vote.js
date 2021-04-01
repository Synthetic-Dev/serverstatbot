const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "vote",
            desc: "Help the bot by upvoting on these sites",
            aliases: [
                "upvote"
            ]
        })
    }

    async execute(message) {
        Util.sendMessage(message, {
            embed: {
                description: `Voting for the bot helps to support the bot grow and encourages the release of new updates and features.\n**Vote for the bot at these links:**\n• [top.gg/vote](https://top.gg/bot/759415210628087841/vote)\n• [discordbotlist.com/vote](https://discordbotlist.com/bots/server-stat/upvote)`,
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                color: 5145560,
                timestamp: Date.now(),
                footer: Util.getFooter(this.client)
            }
        }).catch(console.error)
    }
}

module.exports = Command