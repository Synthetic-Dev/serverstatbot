const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

const LocalSettings = require("../localSettings.json")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setstatuschannel",
            descId: "COMMAND_SETSTATUSCHANNEL",
            aliases: ["setschannel", "statuschannel"],
            args: [
                {
                    name: "setting",
                    descId: "COMMAND_SETSTATUSCHANNEL_ARG1",
                },
                {
                    name: "value",
                },
            ],
            optionTree: {
                here: true,
                remove: true,
                channel: false,
                display: {
                    _shortname: "type",
                    logs: true,
                    panel: true,
                    "panel-players": true,
                },
                message: {
                    id: false,
                },
            },
            perms: ["ADMINISTRATOR"],
        })

        this.setOptionFunc("here", (options) => {
            let channel = options.channel

            if (!channel)
                return Util.couldNotFind(
                    options.message,
                    "channel",
                    "currentChannel",
                    "guild"
                )
            else if (
                !Util.hasPermissionsInChannel(options.guild.me, channel, [
                    "SEND_MESSAGES",
                ])
            )
                return Util.replyError(
                    options.message,
                    options.lang.SEND_MESSAGES_NOPERMS
                )

            options.settings.set("statuschannel", channel.id, "ChannelId")
            Util.replyMessage(
                options.message,
                options.lang.COMMAND_SETSTATUSCHANNEL_SET.format(channel.id)
            ).catch((e) => {
                Util.error(e, "SetStatusChannel", "replyMessage1")
            })
        })
        this.setOptionFunc("remove", (options) => {
            options.settings.update("statuschannel", (data) => {
                Util.replyMessage(
                    options.message,
                    options.lang.COMMAND_SETSTATUSCHANNEL_REMOVE.format(
                        data.ChannelId
                    )
                ).catch((e) => {
                    Util.error(e, "SetStatusChannel", "replyMessage2")
                })
                data.ChannelId = "0"
                return data
            })
        })
        this.setOptionFunc("channel", (options, input) => {
            let channel = Util.parseChannel(options.guild, input)

            if (!channel)
                return Util.couldNotFind(
                    options.message,
                    "channel",
                    input,
                    "guild"
                )
            else if (
                !Util.hasPermissionsInChannel(options.guild.me, channel, [
                    "SEND_MESSAGES",
                ])
            )
                return Util.replyError(
                    options.message,
                    options.lang.SEND_MESSAGES_NOPERMS
                )

            options.settings.set("statuschannel", channel.id, "ChannelId")
            Util.replyMessage(
                options.message,
                options.lang.COMMAND_SETSTATUSCHANNEL_SET.format(channel.id)
            ).catch((e) => {
                Util.error(e, "SetStatusChannel", "replyMessage3")
            })
        })
        this.setOptionFunc("display", (options, input) => {
            input = input.toLowerCase()
            let id = LocalSettings.statuschannels.types.ids[input]
            if (id == null)
                return Util.replyError(
                    options.message,
                    options.lang.COMMAND_SETSTATUSCHANNEL_TYPE_NOID
                )

            options.settings.set("statuschannel", "0", "MessageId")
            options.settings.set("statuschannel", id, "Type")
            Util.replyMessage(
                options.message,
                options.lang.COMMAND_SETSTATUSCHANNEL_TYPE.format(input)
            ).catch((e) => {
                Util.error(e, "SetStatusChannel", "replyMessage4")
            })
        })
        this.setOptionFunc("message", async (options, input) => {
            input = input.toLowerCase()
            if (+input !== +input)
                return Util.replyError(
                    options.message,
                    options.lang.COMMAND_SETSTATUSCHANNEL_MESSAGE_BADID.format(
                        input
                    )
                )

            let statuschannel = await options.settings.get("statuschannel")
            let channel = Util.getChannelById(
                options.guild.channels,
                statuschannel.ChannelId
            )
            if (!channel)
                return Util.replyError(
                    options.message,
                    options.lang.COMMAND_SETSTATUSCHANNEL_MESSAGE_NOCHANNEL
                )

            let message = await Util.getMessageInChannel(channel, input)
            if (!message)
                return Util.replyError(
                    options.message,
                    options.lang.COMMAND_SETSTATUSCHANNEL_MESSAGE_NOMESSAGE
                )
            if (message.author.id != this.client.user.id)
                return Util.replyError(
                    options.message,
                    options.lang.COMMAND_SETSTATUSCHANNEL_MESSAGE_NOTBOT
                )

            options.settings.set("statuschannel", message.id, "MessageId")
            Util.replyMessage(
                options.message,
                options.lang.COMMAND_SETSTATUSCHANNEL_MESSAGE.format(message.id)
            ).catch((e) => {
                Util.error(e, "SetStatusChannel", "replyMessage5")
            })
        })
    }

    async execute(options) {
        return this.executeOptionTree(options)
    }
}

module.exports = Command
