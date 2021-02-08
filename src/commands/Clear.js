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
        let channel = message.channel

        let maxCount = 500
        let count = Number(inputs[0] ? inputs[0] : 1)
        if (typeof(count) != "number" || count == null || isNaN(count)) return Util.replyError(message, "Count must be a number");

        count = Math.abs(count)
        if (count > maxCount) return Util.replyError(message, `Count cannot exceed ${maxCount}`)

        Util.getRecentMessageFrom(channel, this.client.user, count).then(async messages => {
            (await Util.sendMessage(channel, `Found ${messages.length} message(s)`)).then(botMessage => {
                botMessage.delete({
                    timeout: 5000
                })
            }).catch(error => {})

            channel.bulkDelete(messages).then(deleted => {
                Util.sendMessage(channel, `Bulk deleted ${deleted.size} message(s)`).then(botMessage => {
                    botMessage.delete({
                        timeout: 10000
                    })
                }).catch(error => {})
            }).catch(error => {})

            messages.forEach(msg => {
                if (!msg.deleted) {
                    try {
                        msg.delete()
                    } catch(e) {}
                }
            })

            Util.sendMessage(channel, `Deleted ${messages.length} message(s)`).then(botMessage => {
                botMessage.delete({
                    timeout: 10000
                })
            }).catch(error => {})

        }).catch(error => {})
    }
}

module.exports = Command