const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "disable",
            desc: "Disables/enables a command in the guild",
            args: [{
                name: "action",
                desc: "Whether to add or remove the command from being disabled"
            },
            {
                name: "command",
                desc: "The command to disable"
            }],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]
        
        const actions = {
            add: true,
            remove: false
        }
        let action = inputs[0].toLowerCase()
        let state = actions[action]
        if (state == null) {
            return Util.replyError(message, `Invalid action, actions: \`\`${Object.keys(actions).join("``, ``")}\`\``)
        }

        const command = this.client.commands.get(inputs[1].toLowerCase())
        if (!command) return Util.couldNotFind(message, "command", inputs[1]);
        if (!command.hasTag("CAN_DISABLE")) return Util.replyWarning(message, "That command cannot be disabled");

        const commandName = command.name(true)
        settings.update("disabledCommands", disabled => {
            let changeMessage = ""
            let warning = false
            if (state) {
                if (disabled.includes(commandName)) {
                    changeMessage = "That command is already disabled";
                    warning = true
                } else {
                    disabled.push(commandName)
                    changeMessage = `\`\`${commandName}\`\` command has been disabled`;
                }
            } else {
                if (!disabled.includes(commandName)) {
                    changeMessage = "That command is already enabled";
                    warning = true
                } else {
                    disabled = disabled.filter(name => name != commandName)
                    changeMessage = `\`\`${commandName}\`\` command has been enabled`;
                }
            }
            if (warning) Util.replyWarning(message, changeMessage);
            else Util.sendMessage(message, changeMessage);
            return disabled
        })
    }
}

module.exports = Command