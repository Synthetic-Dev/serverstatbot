const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "botping",
            descId: "COMMAND_BOTPING"
        })
    }

    async execute(options) {
        Util.replyMessage(options.message, `${options.lang.PONG} ${this.client.ping}ms`).catch(e => {
            console.error(`BotPing[replyMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command