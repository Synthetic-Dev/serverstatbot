const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "support",
            descId: "COMMAND_SUPPORT",
            aliases: [
                "suprt",
                "spt"
            ]
        })
    }

    async execute(options) {
        Util.sendMessage(options.message, {
            embed: {
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                color: 5145560,
                fields: [
                    {
                        name: options.lang.COMMAND_SUPPORT_FIELD1,
                        value: `[${options.lang.COMMAND_SUPPORT_FIELD1_VAL}](https://donatebot.io/checkout/797779595852120064)`,
                        inline: true
                    },
                    {
                        name: options.lang.COMMAND_SUPPORT_FIELD2,
                        value: `[${options.lang.COMMAND_SUPPORT_FIELD2_VAL}](https://discord.gg/uqVp2XzUP8)`,
                        inline: true
                    },
                    {
                        name: options.lang.COMMAND_SUPPORT_FIELD3,
                        value: options.lang.COMMAND_SUPPORT_FIELD3_VAL.format(Protocol.getMinSupportedVersion())
                    }
                ],
                timestamp: Date.now(),
                footer: Util.getFooter(options.message)
            }
        }).catch(e => {
            console.error(`Support[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command