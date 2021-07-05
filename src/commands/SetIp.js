const Util = require("../utils/Util")
const Protocol = require("../utils/Protocol")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setip",
            descId: "COMMAND_SETIP",
            aliases: ["ip"],
            args: [
                {
                    name: "ip",
                    descId: "EXAMPLE_IP",
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

        options.settings.set("server", ip, "Ip")

        Util.replyMessage(
            options.message,
            (port
                ? options.lang.COMMAND_SETIP_PORTWARNING.format(
                      options.prefix,
                      port,
                      ip
                  )
                : "") + options.lang.COMMAND_SETIP_CONTENT.format(ip)
        ).catch((e) => {
            Util.error(e, "SetIp", "replyMessage")
        })
    }
}

module.exports = Command
