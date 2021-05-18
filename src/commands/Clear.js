const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "clear",
            descId: "COMMAND_CLEAR",
            aliases: [
                "clr"
            ],
            args: [{
                name: "type",
                descId: "COMMAND_CLEAR_ARG1"
            },
            {
                name: "value",
                descId: "COMMAND_CLEAR_ARG2",
                optional: true
            }],
            perms: [
                "MANAGE_MESSAGES"
            ]
        })
    }

    async execute(options) {
        let channel = options.channel

        let deleteMessages = messages => {
            if (!messages || messages == null || messages.length == 0) {
                return Util.replyWarning(options.message, options.lang.COMMAND_CLEAR_NOMESSAGES)
            }

            const maxMessages = 100
            if (messages.length > maxMessages) {
                Util.sendWarning(channel, options.lang.COMMAND_CLEAR_FOUND_MORE_THAN_MAX.format(maxMessages))
                messages = messages.slice(0, maxMessages - 1)
            }

            let deleted = 0
            let deleting = true
            channel.bulkDelete(messages, true).then((deletedMessages) => {deleted += deletedMessages.size; deleting = false}).catch(e => {
                Util.replyMessage(options.message, options.lang.COMMAND_CLEAR_DELETING_MANUALLY).catch(e => {
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
                Util.sendMessage(channel, options.lang.COMMAND_CLEAR_DELETED.format(deleted)).then(botMessage => {
                    botMessage.delete({
                        timeout: 5000
                    }).catch(e => {
                        console.error(`Clear[deleteMessage:count]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                }).catch(e => {
                    console.error(`Clear[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                })

                if (options.message && !options.message.deleted && Util.hasPermissionsInChannel(channel.guild.me, channel, ["MANAGE_MESSAGES"])) {
                    options.message.delete().then(() => {deleted++}).catch(e => {
                        console.error(`Clear[deleteMessage:command]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                }
            })
        }

        let types = {
            after: value => {
                if (!value) return Util.replyError(options.message, options.lang.COMMAND_CLEAR_NEED_DATE);
                let date = Util.parseDate(value)
                if (!date) return Util.replyError(options.message, options.lang.INVALID_DATE);

                Util.sendMessage(channel, options.lang.COMMAND_CLEAR_DELETING_AFTER.format(date.toLocaleString(options.locale, {hour12: false}))).then(botMessage => {
                    botMessage.delete({
                        timeout: 5000
                    }).catch(e => {
                        console.error(`Clear[deleteMessage:date]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                }).catch(e => {
                    console.error(`Clear[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                })

                if (Date.now() - date.getTime() < 0) return Util.replyError(options.message, options.lang.COMMAND_CLEAR_CANT_DELETE_IN_FUTURE);
                if (Date.now() - date.getTime() > 14*24*60*60*1000) return Util.replyError(options.message, options.lang.COMMAND_CLEAR_CANNOT_DELETE_2WEEKS);
                Util.getRecentMessagesAfter(channel, this.client.user, date.getTime()).then(deleteMessages).catch(e => {
                    console.error(`Clear[getRecentMessagesAfter]: ${e.toString()};\n${e.method} at ${e.path}`)
                })
            },
            count: value => {
                let count = Number(value ?? 1)
                if (typeof(count) != "number" || count == null || isNaN(count)) return Util.replyError(options.message, options.lang.MUST_NUMBER.format("value"));
                count = Math.abs(count)

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

        let method = types[options.inputs[0].toLowerCase()]
        if (!method) return Util.replyError(options.message, options.lang.COMMAND_CLEAR_NOT_TYPE.format(options.inputs[0], Object.keys(types).join("``, ``")));
        method(options.inputs[1])
    }
}

module.exports = Command