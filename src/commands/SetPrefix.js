const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setprefix",
            descId: "COMMAND_SETPREFIX",
            aliases: [
                "prefix"
            ],
            args: [{
                name: "prefix"
            }],
            perms: [
                "MANAGE_MESSAGES"
            ]
        })
    }

    async execute(options) {
        if (options.inputs[0].length > 3) return Util.replyError(options.message, options.lang.COMMAND_SETPREFIX_LIMIT)

        options.settings.set("prefix", options.inputs[0], "Prefix")
        Util.replyMessage(options.message, options.lang.COMMAND_SETPREFIX_CONTENT.format(options.inputs[0])).catch(e => {
            console.error(`SetPrefix[replyMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command