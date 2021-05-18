const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "invite",
            descId: "COMMAND_INVITE",
            aliases: [
                "invs",
                "inv"
            ]
        })
    }

    async execute(options) {
        Util.sendMessage(options.message, {
            embed: {
                description: options.lang.COMMAND_INVITE_DESC.format("• [top.gg](https://top.gg/bot/759415210628087841)\n• [bots.gg](https://discord.bots.gg/bots/759415210628087841)\n• [discordbotlist.com](https://discordbotlist.com/bots/server-stat)\n• [botsfordiscord.com](https://botsfordiscord.com/bot/759415210628087841)\n• [discordextremelist.xyz](https://discordextremelist.xyz/en-US/bots/759415210628087841)", options.prefix),
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
            console.error(`Invite[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command