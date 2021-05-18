const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "privacy",
            descId: "COMMAND_PRIVACY",
            aliases: [
                "policy",
                "privacypolicy"
            ]
        })
    }

    async execute(options) {
        Util.sendMessage(options.message, {
            embed: {
                title: options.lang.COMMAND_PRIVACY_TITLE,
                color: 5145560,
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                description: options.lang.COMMAND_PRIVACY_DESC,
                fields: [
                    {
                        name: options.lang.COMMAND_PRIVACY_FIELD1,
                        value: options.lang.COMMAND_PRIVACY_FIELD1_VAL
                    },
                    {
                        name: options.lang.COMMAND_PRIVACY_FIELD2,
                        value: options.lang.COMMAND_PRIVACY_FIELD2_VAL
                    },
                    {
                        name: options.lang.COMMAND_PRIVACY_FIELD3,
                        value: options.lang.COMMAND_PRIVACY_FIELD3_VAL.format(options.prefix)
                    },
                    {
                        name: options.lang.COMMAND_PRIVACY_FIELD4,
                        value: options.lang.COMMAND_PRIVACY_FIELD4_VAL.format(options.prefix)
                    },
                    {
                        name: options.lang.COMMAND_PRIVACY_FIELD5,
                        value: options.lang.COMMAND_PRIVACY_FIELD5_VAL
                    }
                ],
                timestamp: Date.now(),
                footer: Util.getFooter(options.message)
            }
        }).catch(e => {
            console.error(`Privacy[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command