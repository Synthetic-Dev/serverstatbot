const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
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

        settings.editSetting("maintenance", (enabled) => {
            Util.replyMessage(message, `${enabled ? "Disabled :octagonal_sign:" : "Enabled :white_check_mark:"} maintenance mode.`)

            return !enabled
        })
    }
}

module.exports = Command