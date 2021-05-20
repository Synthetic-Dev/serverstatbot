const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "permissions",
            descId: "COMMAND_DEV_PERMISSIONS",
            aliases: [
                "perms"
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(options) {
        Util.sendMessage(options.message, {
            embed: {
                title: "Permissions",
                description: "``" + options.guild.me.permissions.toArray().join("``, ``") + "``",
                color: 4317012,
                timestamp: Date.now()
            }
        }).catch(e => {
            console.error(`Permissions[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command