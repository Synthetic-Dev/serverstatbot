const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
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

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]

        if (inputs[0].length > 3) return Util.replyError(message, "Prefix can only be up to 3 characters long")

        settings.set("prefix", inputs[0])
        Util.replyMessage(message, `Prefix set to '${inputs[0]}'`).catch(e => {
            console.error(`SetPrefix[replyMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command