const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

const LocalSettings = require("../localSettings.json")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "invite",
            descId: "COMMAND_INVITE",
            aliases: [
                "invs",
                "inv"
            ]
        })
    }

    async execute(options) {
        let invites = []

        LocalSettings.botsites.forEach(site => {
            invites.push(`• [${site.hostname}](${site.main})`)
        })

        Util.sendMessage(options.message, {
            embed: {
                description: options.lang.COMMAND_INVITE_DESC.format(invites.join("\n"), options.prefix),
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                color: 5145560,
                timestamp: Date.now(),
                footer: Util.getFooter(options.message)
            }
        }).catch(e => {
            console.error(`Invite[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command