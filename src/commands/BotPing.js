const Discord = require("discord.js")

const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "botping",
            descId: "COMMAND_BOTPING",
            aliases: ["ping"]
        })
    }

    async execute(options) {
        const embed = new Discord.MessageEmbed()
        .setTitle(`${options.lang.PONG} ${this.client.ping}ms`)
        .setColor(5145560)
        .setAuthor(
            this.client.user.username,
            this.client.user.avatarURL({
                size: 64,
                dynamic: true,
                format: "png",
            })
        )

        Util.replyMessage(
            options.message,
            embed
        ).catch((e) => {
            Util.error(e, "BotPing", "sendMessage")
        })
    }
}

module.exports = Command
