const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setport",
            descId: "COMMAND_SETPORT",
            aliases: [
                "port"
            ],
            args: [{
                name: "port",
                descId: "EXAMPLE_PORT"
            }],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(options) {
        let port = Number(options.inputs[0])
        if (typeof(port) != "number" || port == null || isNaN(port)) return Util.replyError(options.message, options.lang.MUST_NUMBER.format("port"));
        port = Math.abs(port)
        if (port > Protocol.maxPort) return Util.replyError(options.message, options.lang.CANNOT_EXCEED.format("port", Protocol.maxPort))

        options.settings.set("server", port, "Port")
        Util.replyMessage(options.message, options.lang.COMMAND_SETPORT_CONTENT.format(port)).catch(e => {
            console.error(`SetPort[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command