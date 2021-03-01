const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "devpermissions",
            desc: "",
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