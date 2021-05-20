const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "resetsettings",
            descId: "COMMAND_RESETSETTINGS",
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(options) {
        options.settings.clear()
        Util.replyMessage(options.message, options.lang.COMMAND_RESETSETTINGS_CONTENT).catch(e => {
            console.error(`SetPort[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command