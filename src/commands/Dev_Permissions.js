const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "permissions",
            desc: "Get bot permissions in current guild",
            aliases: [
                "perms"
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
                description: "``" + message.guild.me.permissions.toArray().join("``, ``") + "``",
                color: 927567,
                timestamp: Date.now()
            }
        }).catch(e => {
            console.error(`Permissions[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command