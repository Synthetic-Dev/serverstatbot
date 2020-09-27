const discord = require("discord.js")
const util = require("../util.js")

const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "devhelp",
            desc: "Displays all commands and bot details",
            aliases: [
                "dhelp"
            ],
            perms: [
                255733848162304002
            ],
            private: true
        })
    }

    async execute(inputs, message) {
        const settings = this.client.settings[message.guild.id]
        const help = this.client.commands.get("help")

        let commands = help.getCommands(this.client.commands, (command) => {
            return true;
        })

        help.postCommands(message.channel, `Prefix: ${await settings.getSetting("prefix")}`, commands)
    }
}

module.exports = Command