const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

const LocalSettings = require("../localSettings.json")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "vote",
            descId: "COMMAND_VOTE",
            aliases: [
                "rate",
                "upvote",
                "votes"
            ]
        })
    }

    async execute(options) {
        let votes = []

        LocalSettings.botsites.forEach(site => {
            if (!site.vote && !site.rate) return;
            votes.push(`• ${site.vote ? `[(Vote)](${site.vote}) ` : ""}${site.rate ? `[(Rate)](${site.rate}) ` : ""}${site.hostname}`)
        })

        Util.sendMessage(options.message, {
            embed: {
                description: options.lang.COMMAND_VOTE_DESC.format(votes.join("\n")),
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
            console.error(`Vote[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command