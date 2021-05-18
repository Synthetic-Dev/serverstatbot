const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "debugpingserver",
            descId: "COMMAND_DEV_PING",
            aliases: [
                "dping"
            ],
            args: [
                {
                    name: "address",
                    descId: "EXAMPLE_ADDRESS"
                },
                {
                    name: "queryport",
                    descId: "COMMAND_PINGSERVER_ARG2",
                    optional: true
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(options) {
        const statusCommand = this.client.commands.get("status")

        let [ip, port] = options.inputs[0].split(":")
        if (!Protocol.isIpValid(ip)) return Util.replyError(options.message, options.lang.INVALID_IP.format(ip));
        port = port ?? 25565

        port = Number(port)
        if (typeof(port) != "number" || port == null || isNaN(port)) return Util.replyError(options.message, options.lang.MUST_NUMBER.format("port"));
        port = Math.abs(port)
        if (port > Protocol.maxPort) return Util.replyError(options.message, options.lang.CANNOT_EXCEED.format("port", Protocol.maxPort))

        let queryPort = options.inputs[1]
        
        if (queryPort) {
            queryPort = Number(queryPort)
            if (typeof(queryPort) != "number" || queryPort == null || isNaN(queryPort)) return Util.replyError(options.message, options.lang.MUST_NUMBER.format("queryport"));
            queryPort = Math.abs(queryPort)
            if (queryPort > Protocol.maxPort) return Util.replyError(options.message, options.lang.CANNOT_EXCEED.format("queryport", Protocol.maxPort))
        }

        statusCommand.displayInfo(options, {ip: ip, port: port, queryPort: queryPort}, (data, fields) => {
            fields.push({
                name: "Debug Info:",
                value: `Ping: ${data.ping}\nQuery: ${data.query}\nCached: ${data.cached}\nBedrock: ${data.bedrock}\nModded: ${data.modded}\nProtocol: ${data.version.protocol}\nSrvRecord: ${JSON.stringify(data.srvRecord)}\nIPv4: ${data.portIPv4}\nIPv6: ${data.portIPv6}`
            })
        })
    }
}

module.exports = Command