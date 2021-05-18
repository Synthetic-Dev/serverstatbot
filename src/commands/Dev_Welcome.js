const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "welcome",
            descId: "COMMAND_DEV_WELCOME",
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    sendWelcome(client, channel, lang, prefix) {
        Util.sendMessage(channel, {
            embed: {
                title: lang.GUILD_JOIN_THANKS.format(client.user.username),
                author: {
                    name: client.user.username,
                    icon_url: client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                description: lang.GUILD_JOIN_DESC.format(prefix, client.user.username),
                color: 5145560,
                timestamp: Date.now(),
                footer: {
                    text: `${client.user.username} | ${process.env.npm_package_version}`
                }
            }
        })
    }

    async execute(options) {
        this.sendWelcome(this.client, options.channel, options.lang, options.prefix)
    }
}

module.exports = Command