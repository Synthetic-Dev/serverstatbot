const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setport",
            desc: "Sets the server port used by the bot, default is 25565",
            aliases: [
                "port"
            ],
            args: [{
                name: "port",
                desc: "The port that your server is served from e.g. ``25565``"
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

        port = Math.abs(port)
        if (port > maxPort) return Util.replyError(message, `Port cannot exceed ${maxPort}`)

        settings.set("port", port)
        Util.replyMessage(message, `Port set to \`\`${port}\`\``).catch(console.error)
    }
}

module.exports = Command