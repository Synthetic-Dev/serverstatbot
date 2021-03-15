const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setaddress",
            desc: "Sets the server address used by the bot, alternative to using ``setip`` and ``setport``",
            aliases: [
                "setaddr",
                "address"
            ],
            args: [{
                name: "address",
                desc: "The address of the server e.g. ``mc.hypixel.net``, ``play.hivemc.net:25565`` or ``172.16.254.1:25665``"
            }],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]
        let [ip, port] = inputs[0].split(":")
        port = port ? port : 25565

        let maxPort = 32768
        port = Number(port)
        if (typeof(port) != "number" || port == null || isNaN(port)) return Util.replyError(message, "Port must be a number");

        port = Math.abs(port)
        if (port > maxPort) return Util.replyError(message, `Port cannot exceed ${maxPort}`)

        settings.setSetting("ip", ip)
        settings.setSetting("port", port)

        Util.replyMessage(message, `Ip set to \`\`${ip}\`\` and Port set to \`\`${port}\`\``)
    }
}

module.exports = Command