const Canvas = require("canvas")
const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "devpingserver",
            desc: "Pings a server with the given details",
            aliases: [
                "dping"
            ],
            args: [
                {
                    name: "address",
                    desc: "The address of the server e.g. ``mc.hypixel.net``, ``play.hivemc.net:25565`` or ``172.16.254.1:25665``"
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(message, inputs) {
        const infoCommand = await this.client.commands.get("info")

        let [ip, port] = inputs[0].split(":")
        port = port ? port : 25565

        let maxPort = 32768
        port = Number(port)
        if (typeof(port) != "number" || port == null || isNaN(port)) return Util.replyError(message, "Port must be a number");

        port = Math.abs(port)
        if (port > maxPort) return Util.replyError(message, `Port cannot exceed ${maxPort}`)

        infoCommand.displayInfo(message, ip, port, (data, fields) => {
            fields.push({
                name: "Debug Info:",
                value: `Ping: ${data.ping}\nQuery: ${data.query}\nCached: ${data.cached}\nBedrock: ${data.bedrock}\nModded: ${data.modded}\nSrvRecord: ${JSON.stringify(data.srvRecord)}\nProtocol: ${data.version.protocol}`
            })
        })
    }
}

module.exports = Command