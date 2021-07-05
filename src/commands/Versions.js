const Discord = require("discord.js")

const Util = require("../utils/Util")
const Protocol = require("../utils/Protocol")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "versions",
            descId: "COMMAND_VERSIONS",
            aliases: ["vers"],
        })
    }

    async execute(options) {
        const embed = new Discord.MessageEmbed()
            .setTitle(options.lang.COMMAND_VERSIONS_TITLE)
            .setDescription(
                options.lang.COMMAND_VERSIONS_DESC.format(
                    Protocol.getMinSupportedVersion()
                )
            )
            .setColor(5145560)
            .setFooter(Util.getFooter(options.message).text)
            .setTimestamp()

        Util.sendMessage(options.message, { embed: embed }).catch((e) => {
            Util.error(e, "Versions", "sendMessage")
        })
    }
}

module.exports = Command
