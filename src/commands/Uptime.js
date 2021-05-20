const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "uptime",
            descId: "COMMAND_UPTIME",
            aliases: [
                "runtime"
            ]
        })
    }

    async execute(options) {
        let hour = Math.floor(this.client.uptime / 1000 / 3600)

        Util.replyMessage(options.message, {
            embed: {
                title: options.lang.UPTIME,
                color: 5145560,
                description: `:clock${hour % 12 > 0 ? hour % 12 : 12}: ` + options.lang.TIME_FORMAT_LONG.format(hour, Math.floor((this.client.uptime / 1000 / 60) % 60), Math.floor(this.client.uptime / 1000 % 60)),
                timestamp: Date.now()
            }
        }).catch(e => {
            console.error(`Uptime[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command