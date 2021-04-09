const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "donate",
            desc: "Donation info for the bot"
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
                title: "Donate",
                url: "https://donatebot.io/checkout/797779595852120064",
                description: "Donating helps to keep the bot up, working and online 24/7!\n\nSubscriptions will give you access to amazing additional features supplied by the bot. Find out more information on the donation page.",
                timestamp: Date.now(),
                footer: Util.getFooter(this.client)
            }
        }).catch(e => {
            console.error(`Donate[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command