const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "setport",
            desc: "Sets the server port used by the bot, default is 25565",
            aliases: [
                "port"
            ],
            args: [{
                name: "port",
                desc: "The port"
            }],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]

        let maxPort = 32768
        let port = Number(inputs[0])

        if (typeof(port) != "number" || port == null || isNaN(port)) return Util.replyError(message, "Port must be a number");

        if (inputs[0].length > 5 || Math.abs(port) > maxPort) return Util.replyError(message, `Port cannot exceed ${maxPort}`)

        settings.setSetting("port", port)

        try {
            message.reply(`Port set to '${inputs[0]}'`)
        } catch(e) {console.error(e)}
    }
}

module.exports = Command