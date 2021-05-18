const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "disabled",
            descId: "COMMAND_DISABLED",
            args: [{
                name: "action",
                descId: "COMMAND_DISABLED_ARG1"
            },
            {
                name: "command",
                descId: "COMMAND_DISABLED_ARG2",
                optional: true
            }],
            optionTree: {
                add: {
                    "command": false
                },
                remove: {
                    "command": false
                },
                removeall: true
            },
            perms: [
                "ADMINISTRATOR"
            ]
        })

        this.setOptionFunc("add", (options, input) => {
            const command = this.client.commands.get(input.toLowerCase())
            if (!command) return Util.couldNotFind(options.message, "command", input);
            if (!command.hasTag("CAN_DISABLE")) return Util.replyWarning(options.message, options.lang.COMMAND_DISABLED_CANNOT_DISABLE);

            options.settings.update("disabledCommands", data => {
                if (data.Commands.includes(command.name)) {
                    Util.replyWarning(options.message, options.lang.COMMAND_DISABLED_ALREADY_DISABLED);
                } else {
                    data.Commands.push(command.name)
                    Util.sendMessage(options.message, options.lang.COMMAND_DISABLED_DISABLED.format(command.name));
                }

                return data
            })
        })
        this.setOptionFunc("remove", (options, input) => {
            const command = this.client.commands.get(input.toLowerCase())
            if (!command) return Util.couldNotFind(options.message, "command", input);

            options.settings.update("disabledCommands", data => {
                if (!data.Commands.includes(command.name)) {
                    Util.replyWarning(options.message, options.lang.COMMAND_DISABLED_ALREADY_ENABLED);
                } else {
                    data.Commands = data.Commands.filter(name => name != command.name)
                    Util.sendMessage(options.message, options.lang.COMMAND_DISABLED_ENABLED.format(command.name));
                }

                return data
            })
        })
        this.setOptionFunc("removeall", options => {
            options.settings.set("disabledCommands", [], "Commands")
            Util.sendMessage(options.message, options.lang.COMMAND_DISABLED_ENABLE_ALL);
        })
    }

    async execute(options) {
        return this.executeOptionTree(options)
    }
}

module.exports = Command