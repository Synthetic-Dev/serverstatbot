const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "invite",
            desc: "Invite link for the bot"
        })
    }

    async execute(message) {
        Util.sendMessage(message, {
            embed: {
                description: `[Click here to invite the bot](https://discord.com/oauth2/authorize?client_id=${message.client.user.id}&scope=bot%20identify%20guilds&permissions=1275587792)`,
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                color: 5145560,
                footer: Util.getFooter(this.client)
            }
        })
    }
}

module.exports = Command