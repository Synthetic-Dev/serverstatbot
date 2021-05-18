const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "vote",
            descId: "COMMAND_VOTE",
            aliases: [
                "upvote",
                "votes"
            ]
        })
    }

    async execute(options) {
        Util.sendMessage(options.message, {
            embed: {
                description: options.lang.COMMAND_VOTE_DESC.format("• [top.gg/vote](https://top.gg/bot/759415210628087841/vote)\n• [discordbotlist.com/vote](https://discordbotlist.com/bots/server-stat/upvote)\n• [botsfordiscord.com/vote](https://botsfordiscord.com/bot/759415210628087841/vote)\n• [discordextremelist.xyz/vote](https://discordextremelist.xyz/en-US/bots/759415210628087841/upvote)"),
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
                footer: Util.getFooter(options.message)
            }
        }).catch(e => {
            console.error(`Vote[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command