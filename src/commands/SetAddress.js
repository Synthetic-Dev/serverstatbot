const Util = require("../utils/Util")
const Protocol = require("../utils/Protocol")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setaddress",
            descId: "COMMAND_SETADDRESS",
            aliases: ["setaddr", "address"],
            args: [
                {
                    name: "address",
                    descId: "EXAMPLE_ADDRESS",
                },
            ],
            perms: ["ADMINISTRATOR"],
        })
    }

    async execute(options) {
        let [ip, port] = options.inputs[0].split(":")
        if (!Protocol.isIpValid(ip))
            return Util.replyError(
                options.message,
                options.lang.INVALID_IP.format(ip)
            )
        port = port ?? 25565

        port = Number(port)
        if (typeof port != "number" || port == null || isNaN(port))
            return Util.replyError(
                options.message,
                options.lang.MUST_NUMBER.format("port")
            )
        port = Math.abs(port)
        if (port > Protocol.maxPort)
            return Util.replyError(
                options.message,
                options.lang.CANNOT_EXCEED.format("port", Protocol.maxPort)
            )

        options.settings.update("server", (data) => {
            data.Ip = ip
            data.Port = port
            return data
        })

        Util.replyMessage(
            options.message,
            options.lang.COMMAND_SETADDRESS_CONTENT.format(ip, port)
        ).catch((e) => {
            Util.error(e, "SetAddress", "replyMessage")
        })
    }
}

module.exports = Command
