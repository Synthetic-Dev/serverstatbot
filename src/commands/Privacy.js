const Discord = require("discord.js")

const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "privacy",
            descId: "COMMAND_PRIVACY",
            aliases: ["policy", "privacypolicy"],
        })
    }

    async execute(options) {
        const embed = new Discord.MessageEmbed()
            .setTitle(options.lang.COMMAND_PRIVACY_TITLE)
            .setDescription(options.lang.COMMAND_PRIVACY_DESC)
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
                    name: options.lang.COMMAND_PRIVACY_FIELD1,
                    value: options.lang.COMMAND_PRIVACY_FIELD1_VAL,
                },
                {
                    name: options.lang.COMMAND_PRIVACY_FIELD2,
                    value: options.lang.COMMAND_PRIVACY_FIELD2_VAL,
                },
                {
                    name: options.lang.COMMAND_PRIVACY_FIELD3,
                    value: options.lang.COMMAND_PRIVACY_FIELD3_VAL.format(
                        options.prefix
                    ),
                },
                {
                    name: options.lang.COMMAND_PRIVACY_FIELD4,
                    value: options.lang.COMMAND_PRIVACY_FIELD4_VAL.format(
                        options.prefix
                    ),
                },
                {
                    name: options.lang.COMMAND_PRIVACY_FIELD5,
                    value: options.lang.COMMAND_PRIVACY_FIELD5_VAL,
                },
            ])
            .setFooter(Util.getFooter(options.message).text)
            .setTimestamp()

        Util.sendMessage(options.message, { embed: embed }).catch((e) => {
            Util.error(e, "Privacy", "sendMessage")
        })
    }
}

module.exports = Command
