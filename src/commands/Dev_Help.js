const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
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
        const help = this.client.commands.get("help")
        let commands = help.getCommands(this.client.commands, () => {
            return true;
        })

        help.postCommands(message, commands)
    }
}

module.exports = Command