const discord = require("discord.js")
const util = require("../util.js")

const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "setprefix",
            desc: "Sets the prefix used by the bot",
            aliases: [
                "prefix"
            ],
            args: [{
                name: "prefix",
                desc: "The prefix"
            }],
            perms: [
                "MANAGE_MESSAGES"
            ]
        })
    }

    async execute(inputs, message) {
        const settings = this.client.settings[message.guild.id]

        settings.setSetting("prefix", inputs[0])

        message.reply(`Prefix set to '${inputs[0]}'`)
    }
}

module.exports = Command