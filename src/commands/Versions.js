const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "versions",
            descId: "COMMAND_VERSIONS",
            aliases: [
                "vers"
            ]
        })
    }

    async execute(options) {
        Util.sendMessage(options.message, {
            embed: {
                title: options.lang.COMMAND_VERSIONS_TITLE,
                description: options.lang.COMMAND_VERSIONS_DESC.format(Protocol.getMinSupportedVersion()),
                color: 5145560,
                timestamp: Date.now(),
                footer: Util.getFooter(options.message)
            }
        }).catch(e => {
            console.error(`Versions[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command