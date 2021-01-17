const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
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
        const onlineFor = Math.abs(((new Date()).getTime() - this.client.startTime.getTime()) / 1000)
        Util.replyMessage(message, `I have been online for ${Math.floor(onlineFor / 3600)}h ${Math.floor((onlineFor / 60) % 60)}m ${Math.floor(onlineFor % 60)}s`)
    }
}

module.exports = Command