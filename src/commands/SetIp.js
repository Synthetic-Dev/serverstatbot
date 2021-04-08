const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setip",
            desc: "Sets the server ip used by the bot",
            aliases: [
                "ip"
            ],
            args: [{
                name: "ip",
                desc: "The ip of your server e.g. ``172.16.254.1`` or ``mc.hypixel.net``"
            }],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]
        let [ip, port] = inputs[0].split(":")

        settings.set("ip", ip)

        Util.replyMessage(message, `${port ? `:warning: Found port in ip, to set the port do \`\`${await settings.get("prefix")}setport ${port}\`\`\n` : ""}Ip set to \`\`${ip}\`\``).catch(console.error)
    }
}

module.exports = Command