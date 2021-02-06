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
                "DEV"
            ],
            private: true
        })
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]
        const help = this.client.commands.get("help")

        let commandliststring = help.getCommands(this.client.commands, command => {
            return true;
        })

        help.postCommands(message, `Prefix: ${await settings.getSetting("prefix")}`, commandliststring)
    }
}

module.exports = Command