const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setlogchannel",
            desc: "Sets the text channel that join/leave messages will be shown",
            args: [{
                name: "channel | 'here' | 'clear'",
                desc: "The channel"
            }],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]

        let channel = inputs[0] == "here" ? message.channel : Util.parseChannel(message.guild, inputs[0])
        
        if (inputs[0] == "clear") {
            Util.replyMessage(message, `Removed log channel`).catch(console.error)
            return settings.set("logchannel", "0")
        } else if (!channel) {
            return Util.couldNotFind(message, "channel", inputs[0], "guild")
        } else if (!Util.doesMemberHavePermissionsInChannel(message.guild.me, channel, ["SEND_MESSAGES"])) return Util.replyError(message, "I do not have permission to send messages in that channel!");
        
        Util.replyMessage(message, `Log channel set to <#${channel.id}>`).catch(console.error)
        settings.set("logchannel", channel.id)
    }
}

module.exports = Command