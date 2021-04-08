const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "botping",
            desc: "Returns the bot's ping"
        })
    }

    async execute(message) {
        Util.replyMessage(message, `Pong! ${Math.abs(Util.ping(message))}ms`).catch(console.error)
    }
}

module.exports = Command