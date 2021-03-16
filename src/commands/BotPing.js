const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "botping",
            desc: "Returns the bot's ping"
        })
    }

    async execute(message) {
        Util.replyMessage(message, `Pong! ${Math.abs(Util.ping(message))}ms`)
    }
}

module.exports = Command