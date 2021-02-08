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
        let maxCount = 500
        let count = Number(inputs[0])
        if (typeof(count) != "number" || count == null || isNaN(count)) return Util.replyError(message, "Count must be a number");

        count = Math.abs(count)
        if (count > maxCount) return Util.replyError(message, `Count cannot exceed ${maxCount}`)

        let messages = await Util.getRecentMessageFrom(message.channel, this.client.user, count)
        message.channel.bulkDelete(messages, true).then(deleted => {
            Util.sendMessage(message, `Deleted ${deleted.size} message(s)`).then(botMessage => {
                botMessage.delete({
                    timeout: 10000
                })
            }).catch(error => {})
        }).catch(error => {})

        try {
            message.delete()
        } catch(e) {}
    }
}

module.exports = Command