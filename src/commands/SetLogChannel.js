const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "setlogchannel",
            desc: "Sets the text channel that join/leave messages will be shown",
            args: [{
                name: "channel | 'here' | 'clear'",
                desc: "The channel"
            }],
            perms: [
                "MANAGE_CHANNELS"
            ]
        })
    }

    async execute(inputs, message) {
        const settings = this.client.settings[message.guild.id]

        let channel = inputs[0] == "here" ? message.channel : Util.parseChannel(message.guild, inputs[0])
        
        if (inputs[0] == "clear") {
            try {
                message.reply(`Removed log channel`)
            } catch(e) {console.error(e)}

            return settings.setSetting("logchannel", "0")
        } else if (!channel) return Util.couldNotFind(message, "channel", inputs[0], "guild");
        
        try {
            message.reply(`Log channel set to <#${channel.id}>`)
        } catch(e) {console.error(e)}

        settings.setSetting("logchannel", channel.id)
    }
}

module.exports = Command