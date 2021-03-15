const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "devpermissions",
            desc: "Get bot permissions in current guild",
            aliases: [
                "dpermissions",
                "dperms"
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(message) {
        Util.sendMessage(message, {
            embed: {
                title: "PERMISSIONS",
                description: "``" + message.guild.me.permissions.toArray().join("``, ``") + "``"
            }
        })
    }
}

module.exports = Command