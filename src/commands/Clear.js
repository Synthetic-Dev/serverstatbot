const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "clear",
            desc: "Clears the given amount of bot messages",
            aliases: [
                "clr"
            ],
            args: [{
                name: "count",
                desc: "The amount of messages you want to clear, defaults to ``1``",
                optional: true
            }],
            perms: [
                "MANAGE_MESSAGES"
            ]
        })
    }

    async execute(message, inputs) {
        let messages = await Util.getRecentMessageFrom(message.channel, this.client.user, inputs[0])
        let messagesDeleted = 0
        messages.forEach(message => {
            try {
                message.delete();
                messagesDeleted++
            } catch(e) {}
        })

        let botMessage = await Util.sendMessage(message, `Deleted ${messagesDeleted} message(s)`)
        botMessage.delete({
            timeout: 10000
        })

        try {
            message.delete()
        } catch(e) {}
    }
}

module.exports = Command