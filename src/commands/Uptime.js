const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "uptime",
            desc: "Returns the bot's uptime",
            aliases: [
                "runtime"
            ]
        })
    }

    async execute(message) {
        Util.replyMessage(message, {
            embed: {
                title: "Uptime",
                color: 5145560,
                description: `${Math.floor(this.client.uptime / 1000 / 3600)} hours ${Math.floor((this.client.uptime / 1000 / 60) % 60)} minutes and ${Math.floor(this.client.uptime / 1000 % 60)} seconds`,
                timestamp: Date.now()
            }
        }).catch(e => {
            console.error(`Uptime[replyMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command