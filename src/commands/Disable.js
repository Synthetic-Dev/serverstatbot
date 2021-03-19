const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "disable",
            desc: "Disables/enables a command in the guild, example: ``.disable whois true``",
            args: [{
                name: "command",
                desc: "The command to disable"
            },
            {
                name: "state",
                desc: "Whether to disable or enable the command, defaults to disable",
                optional: true
            }],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]
        
        const command = this.client.commands.get(inputs[0].toLowerCase())
        if (!command) return Util.couldNotFind(message, "command", inputs[0]);
        if (!command.hasTag("CAN_DISABLE")) return Util.replyWarning(message, "That command cannot be disabled");
        
        let state = true
        if (inputs[1]) {
            let stateTypes_true = ["y", "yes", "true"]
            let stateTypes_false = ["n", "no", "false"]
            let trueState = stateTypes_true.includes(inputs[1].toLowerCase())
            let falseState = stateTypes_false.includes(inputs[1].toLowerCase())
            if (!trueState && !falseState) return Util.replyError(message, `Not a valid state, must be: ${stateTypes_true.concat(stateTypes_false).join(", ")}`);
            if (falseState) state = false;
        }

        const commandName = command.name(true)
        settings.update("disabledCommands", disabled => {
            let changeMessage = ""
            if (state) {
                if (disabled.includes(commandName)) {
                    changeMessage = "That command is already disabled";
                } else {
                    disabled.push(commandName)
                    changeMessage = `\`\`${commandName}\`\` command has been disabled`;
                }
            } else {
                if (!disabled.includes(commandName)) {
                    changeMessage = "That command is already enabled";
                } else {
                    disabled = disabled.filter(name => name != commandName)
                    changeMessage = `\`\`${commandName}\`\` command has been enabled`;
                }
            }
            Util.replyWarning(message, changeMessage)
            return disabled
        })
    }
}

module.exports = Command