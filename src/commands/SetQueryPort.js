const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setqueryport",
            descId: "COMMAND_SETQUERYPORT",
            aliases: [
                "setqport",
                "queryport",
                "qport"
            ],
            args: [{
                name: "port",
                descId: "COMMAND_SETQUERYPORT_ARG1"
            }],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(options) {
        let port = Number(options.inputs[0])
        if (typeof(port) != "number" || port == null || isNaN(port)) return Util.replyError(options.message, options.lang.MUST_NUMBER.format("port"));
        if (port == 0 || port == -1) {
            options.settings.set("server", -1, "QueryPort")
            return Util.replyMessage(options.message, options.lang.COMMAND_SETQUERYPORT_REMOVED).catch(e => {
                console.error(`SetQueryPort[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
            })
        }
        
        port = Math.abs(port)
        if (port > Protocol.maxPort) return Util.replyError(options.message, options.lang.CANNOT_EXCEED.format("port", Protocol.maxPort))

        options.settings.set("server", port, "QueryPort")
        Util.replyMessage(options.message, options.lang.COMMAND_SETQUERYPORT_CONTENT.format(port)).catch(e => {
            console.error(`SetQueryPort[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command