const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "maintenance",
            desc: "Enables/disables maintenance mode",
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(message) {
        const settings = this.client.globalSettings

        settings.update("maintenance", (enabled) => {
            Util.replyMessage(message, `${enabled ? "Disabled :octagonal_sign:" : "Enabled :white_check_mark:"} maintenance mode.`).catch(e => {
                console.error(`Maintenance[replyMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
            })

            return !enabled
        })
    }
}

module.exports = Command