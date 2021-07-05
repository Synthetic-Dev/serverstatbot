const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "devhelp",
            descId: "COMMAND_DEV_HELP",
            aliases: ["dhelp"],
            perms: ["DEV"],
            private: true,
        })
    }

    async execute(options) {
        const help = this.client.commands.get("help")
        let commands = help.getCommands(this.client.commands, () => {
            return true
        })

        help.postCommands(options, commands, "", 4317012)
    }
}

module.exports = Command
