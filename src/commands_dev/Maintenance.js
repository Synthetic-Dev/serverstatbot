const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "maintenance",
            descId: "COMMAND_DEV_MAINTENANCE",
            perms: ["DEV"],
            private: true,
        })
    }

    async execute(options) {
        this.client.globalSettings.update("Maintenance", (value) => {
            value = !value
            Util.replyMessage(
                options.message,
                `${
                    value
                        ? "Enabled :white_check_mark:"
                        : "Disabled :octagonal_sign:"
                } maintenance mode.`
            ).catch((e) => {
                Util.error(e, "Dev_Maintenance", "replyMessage")
            })

            return value
        })
    }
}

module.exports = Command
