const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "setip",
            desc: "Sets the server ip used by the bot",
            aliases: [
                "ip"
            ],
            args: [{
                name: "ip",
                desc: "The ip"
            }],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]

        settings.setSetting("ip", inputs[0])

        try {
            message.reply(`Ip set to '${inputs[0]}'`)
        } catch(e) {console.error(e)}
    }
}

module.exports = Command