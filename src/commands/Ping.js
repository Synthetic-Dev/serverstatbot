const discord = require("discord.js")
const util = require("../util.js")

const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "botping",
            desc: "Returns the bot's ping",
            private: true
        })
    }

    async execute(inputs, message) {
        const ping = util.ping(message)

        message.reply(`Pong! ${Math.abs(ping)}ms`)
    }
}

module.exports = Command