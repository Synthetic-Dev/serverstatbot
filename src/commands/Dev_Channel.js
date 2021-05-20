const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "channel",
            descId: "COMMAND_DEV_CHANNEL",
            args: [
                {
                    name: "channel",
                    descId: "COMMAND_DEV_CHANNEL_ARG1"
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(options) {
        let channel = Util.getChannelById(this.client.channels, options.inputs[0])
        if (!channel) return Util.couldNotFind(options.message, options.lang.CHANNEL, options.inputs[0])
        Util.sendMessage(options.message, {
            embed: {
                title: options.lang.COMMAND_DEV_CHANNEL_TITLE.format(channel.name),
                description: options.lang.COMMAND_DEV_CHANNEL_DESC.format(channel.id, channel.guild.id, channel.viewable, channel.messages.cache.size, channel.permissionsFor(channel.guild.me).toArray().join("``, ``")),
                color: 4317012,
                timestamp: Date.now()
            }
        }).catch(e => {
            console.error(`Channel[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command