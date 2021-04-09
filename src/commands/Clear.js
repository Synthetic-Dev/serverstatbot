const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "clear",
            desc: "Clears messages from the bot",
            aliases: [
                "clr"
            ],
            args: [{
                name: "type",
                desc: "The clearing action type"
            },
            {
                name: "value",
                desc: "The value for the type of clearing",
                optional: true
            }],
            perms: [
                "MANAGE_MESSAGES"
            ]
        })
    }

    async execute(message, inputs) {
        let channel = message.channel

        let deleteMessages = messages => {
            if (!messages || messages == null || messages.length == 0) {
                return Util.replyWarning(channel, `No messages found!`).catch(e => {
                    console.error(`Clear[replyWarning]: ${e.toString()};\n${e.method} at ${e.path}`)
                })
            }

            const maxMessages = 100
            if (messages.length > maxMessages) {
                Util.sendWarning(channel, `More than 100 messages found, only deleting the first 100. To delete more messages run this command again.`).catch(e => {
                    console.error(`Clear[sendWarning]: ${e.toString()};\n${e.method} at ${e.path}`)
                })

                messages = messages.slice(0, maxMessages - 1)
            }

            let deleted = 0
            let deleting = true
            channel.bulkDelete(messages, true).then((deletedMessages) => {deleted += deletedMessages.size; deleting = false}).catch(e => {
                Util.replyMessage(message, `Deleting messages manually, this may take some time. In order to increase deletion time please give the bot permissions to manage messages.`).catch(e => {
                    console.error(`Clear[replyMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                })

                deleting = true
                let completed = 0
                messages.forEach(msg => {
                    try {
                        if (!msg || msg.deleted) {
                            completed++
                            if (deleting && completed >= messages.length) deleting = false;
                            return
                        };

                        msg.delete().then(() => {deleted++}).catch(e => {
                            console.error(`Clear[deleteMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                        }).finally(() => {
                            completed++
                            if (deleting && completed >= messages.length) deleting = false;
                        })
                    } catch(e) {
                        console.error(`Clear[deleteMessage:stack]: ${e.toString()};\n${e.method} at ${e.path}`)
                        completed++
                        if (deleting && completed >= messages.length) deleting = false;
                    }
                })
            }).finally(async () => {
                while (deleting) await Util.sleep(1000);
                Util.sendMessage(channel, `Deleted ${deleted} message(s)`).then(botMessage => {
                    botMessage.delete({
                        timeout: 5000
                    }).catch(e => {
                        console.error(`Clear[deleteMessage:count]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                }).catch(e => {
                    console.error(`Clear[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                })

                if (message && !message.deleted && Util.doesMemberHavePermissionsInChannel(channel.guild.me, channel, ["MANAGE_MESSAGES"])) {
                    message.delete().then(() => {deleted++}).catch(e => {
                        console.error(`Clear[deleteMessage:command]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                }
            })
        }

        let types = {
            after: value => {
                if (!value) return Util.replyError(message, "Must specifiy a date and/or time, e.g. ``today``, ``yesterday``, ``last week``, ``yyyy/mm/dd``");
                let date = Util.parseDate(value)
                if (!date) return Util.replyError(message, "Invalid date");

                Util.sendMessage(channel, `Deleting messages after ${date.toDateString()}`).then(botMessage => {
                    botMessage.delete({
                        timeout: 5000
                    }).catch(e => {
                        console.error(`Clear[deleteMessage:date]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                }).catch(e => {
                    console.error(`Clear[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                })

                if (Date.now() - date.getTime() < 0) return Util.replyError(message, "Cannot delete messages from the future!");
                if (Date.now() - date.getTime() > 14*24*60*60*1000) return Util.replyError(message, "Cannot delete messages older than 2 weeks");
                Util.getRecentMessagesAfter(channel, this.client.user, date.getTime()).then(deleteMessages).catch(e => {
                    console.error(`Clear[getRecentMessagesAfter]: ${e.toString()};\n${e.method} at ${e.path}`)
                })
            },
            count: value => {
                let maxCount = 200
                let count = Number(value ? value : 1)
                if (typeof(count) != "number" || count == null || isNaN(count)) return Util.replyError(message, "Count must be a number");

                count = Math.abs(count)
                if (count > maxCount) return Util.replyError(message, `Count cannot exceed ${maxCount}`)

                Util.getRecentMessagesFrom(channel, this.client.user, count).then(deleteMessages).catch(e => {
                    console.error(`Clear[getRecentMessagesFrom]: ${e.toString()};\n${e.method} at ${e.path}`)
                })
            },
            previous: () => {
                Util.getRecentMessagesFrom(channel, this.client.user, 1).then(deleteMessages).catch(e => {
                    console.error(`Clear[getRecentMessagesFrom]: ${e.toString()};\n${e.method} at ${e.path}`)
                })
            }
        }

        let method = types[inputs[0].toLowerCase()]
        if (!method) return Util.replyError(message, `${inputs[0]} is not a clearing type, types are: \`\`${Object.keys(types).join("``, ``")}\`\``);
        method(inputs[1])
    }
}

module.exports = Command