const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "setip",
            desc: "Sets the server ip used by the bot",
            aliases: [
                "ip"
            ],
            args: [{
                name: "ip",
                desc: "The ip"
            }],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]
        let [ip, port] = inputs[0].split(":")

        settings.setSetting("ip", ip)

        Util.replyMessage(message, (port ? `:warning: Found port in ip, to set the port do \`\`${await settings.getSetting("prefix")}setport ${port}\`\`\n` : "") + `Ip set to '${ip}'`)
    }
}

module.exports = Command