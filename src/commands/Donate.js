const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "donate",
            descId: "COMMAND_DONATE"
        })
    }

    async execute(options) {
        Util.sendMessage(options.message, {
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
                title: options.lang.COMMAND_DONATE_TITLE,
                url: "https://donatebot.io/checkout/797779595852120064",
                description: options.lang.COMMAND_DONATE_DESC,
                timestamp: Date.now(),
                footer: Util.getFooter(options.message)
            }
        }).catch(e => {
            console.error(`Donate[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command