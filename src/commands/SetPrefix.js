const Util = require("../utils/util.js")
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

        if (inputs[0].length > 3) return Util.replyError(message, "Prefix can only be up to 3 characters long")

        settings.setSetting("prefix", inputs[0])

        try {
            message.reply(`Prefix set to '${inputs[0]}'`)
        } catch(e) {console.error(e)}
    }
}

module.exports = Command