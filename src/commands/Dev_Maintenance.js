const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "maintenance",
            descId: "COMMAND_DEV_MAINTENANCE",
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(options) {
        this.client.globalSettings.update("Maintenance", value => {
            value = !value
            Util.replyMessage(options.message, `${value ? "Enabled :white_check_mark:" : "Disabled :octagonal_sign:"} maintenance mode.`).catch(e => {
                console.error(`Maintenance[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
            })

            return value
        })
    }
}

module.exports = Command