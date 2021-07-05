const Discord = require("discord.js")

const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "uptime",
            descId: "COMMAND_UPTIME",
            aliases: ["runtime"],
        })
    }

    async execute(options) {
        let hour = Math.floor(this.client.uptime / 1000 / 3600)
        const embed = new Discord.MessageEmbed()
            .setTitle(options.lang.UPTIME)
            .setDescription(
                `:clock${hour % 12 > 0 ? hour % 12 : 12}: ` +
                    options.lang.TIME_FORMAT_LONG.format(
                        hour,
                        Math.floor((this.client.uptime / 1000 / 60) % 60),
                        Math.floor((this.client.uptime / 1000) % 60)
                    )
            )
            .setColor(5145560)
            .setTimestamp()

        Util.replyMessage(options.message, { embed: embed }).catch((e) => {
            Util.error(e, "Uptime", "replyMessage")
        })
    }
}

module.exports = Command
