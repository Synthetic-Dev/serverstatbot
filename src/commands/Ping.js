const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "botping",
            desc: "Returns the bot's ping",
            private: true
        })
    }

    async execute(message) {
        const ping = Util.ping(message)

        message.reply(`Pong! ${Math.abs(ping)}ms`)
    }
}

module.exports = Command