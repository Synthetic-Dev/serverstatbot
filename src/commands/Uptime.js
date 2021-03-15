const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

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
        const onlineFor = Math.abs((Date.now() - this.client.startTime) / 1000)
        Util.replyMessage(message, `I have been online for ${Math.floor(onlineFor / 3600)}h ${Math.floor((onlineFor / 60) % 60)}m ${Math.floor(onlineFor % 60)}s`)
    }
}

module.exports = Command