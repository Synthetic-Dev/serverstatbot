const Discord = require("discord.js")

const Util = require("../utils/Util")
const Protocol = require("../utils/Protocol")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "support",
            descId: "COMMAND_SUPPORT",
            aliases: ["suprt", "spt"],
        })
    }

    async execute(options) {
        const embed = new Discord.MessageEmbed()
            .setColor(5145560)
            .setAuthor(
                this.client.user.username,
                this.client.user.avatarURL({
                    size: 64,
                    dynamic: true,
                    format: "png",
                })
            )
            .addFields([
                {
                    name: options.lang.COMMAND_SUPPORT_FIELD1,
                    value: `[${options.lang.COMMAND_SUPPORT_FIELD1_VAL}](https://donatebot.io/checkout/797779595852120064)`,
                    inline: true,
                },
                {
                    name: options.lang.COMMAND_SUPPORT_FIELD2,
                    value: `[${options.lang.COMMAND_SUPPORT_FIELD2_VAL}](https://discord.gg/uqVp2XzUP8)`,
                    inline: true,
                },
                {
                    name: options.lang.COMMAND_SUPPORT_FIELD3,
                    value: options.lang.COMMAND_SUPPORT_FIELD3_VAL.format(
                        Protocol.getMinSupportedVersion()
                    ),
                },
            ])
            .setFooter(Util.getFooter(options.message).text)
            .setTimestamp()

        Util.sendMessage(options.message, { embed: embed }).catch((e) => {
            Util.error(e, "Support", "sendMessage")
        })
    }
}

module.exports = Command
