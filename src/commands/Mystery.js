const Discord = require("discord.js")
const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "mystery",
            desc: "",
            aliases: [
                "shouldi",
                "isit",
                "8ball"
            ],
            private: true,
            secret: true
        })
    }

    async execute(message) {
        let choices = ["yes", "no", "maybe", "who knows ¯\\\_(ツ)\_/¯", "possibly"]
        
        Util.sendMessage(message.channel, choices[Math.floor(Math.random() * choices.length)])
    }
}

module.exports = Command