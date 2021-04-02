const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "leave",
            desc: "Makes the bot leave a server",
            args: [
                {
                    name: "server",
                    desc: "GuildId for the server"
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(message, inputs) {
        Util.getGuildById(this.client, inputs[0]).then(guild => {
            guild.leave().then(() => {
                Util.replyMessage(message, `Successfully left guild \`\`${guild.name}\`\``)
            }).catch(err => {
                Util.replyError(message, "Error while leaving guild")
                console.error(err)
            })
        }).catch(err => {
            Util.replyError(message, "Error while getting guild")
            console.error(err)
        })
    }
}

module.exports = Command