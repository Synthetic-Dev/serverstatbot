const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "embed",
            descId: "COMMAND_DEV_EMBED",
            args: [
                {
                    name: "action",
                    descId: "COMMAND_DEV_EMBED_ARG1",
                },
                {
                    name: "",
                    multiple: true,
                },
            ],
            perms: ["DEV"],
            private: true,
        })
    }

    async execute(options) {
        const actions = {
            send: true,
            edit: false,
        }
        let action = options.inputs[0].toLowerCase()
        let state = actions[action]
        if (state == null) {
            return Util.replyError(
                options.message,
                `Invalid action, actions: \`${Object.keys(actions).join(
                    "`, `"
                )}\``
            )
        }

        if (state) {
            let argumentCount = 2
            let end = options.inputs.slice(argumentCount - 1).join(" ")
            options.inputs = options.inputs.slice(0, argumentCount - 1)
            options.inputs[argumentCount - 1] = end

            eval(`Util.sendMessage(options.channel, {
                embed: ${options.inputs[1]}
            }).catch(e => {
                Util.replyError(options.message, \`Error sending embed: \${e}\`)
            })`)
        } else {
            let argumentCount = 3
            let end = options.inputs.slice(argumentCount - 1).join(" ")
            options.inputs = options.inputs.slice(0, argumentCount - 1)
            options.inputs[argumentCount - 1] = end

            let embedMessage = await Util.getMessageInChannel(
                options.channel,
                options.inputs[1]
            )
            if (!embedMessage)
                return Util.couldNotFind(
                    options.message,
                    "message",
                    options.inputs[1],
                    "channel"
                )

            let newEmbed = options.inputs[2]
            if (!newEmbed) return Util.replyError("Expected embed content")
            try {
                newEmbed = JSON.parse(options.inputs[2])
            } catch (e) {
                return Util.replyError(
                    options.message,
                    `Error parsing embed: ${e}`
                )
            }

            embedMessage
                .edit({
                    embed: newEmbed,
                })
                .catch((e) => {
                    Util.replyError(
                        options.message,
                        `Error editing embed: ${e}`
                    )
                })
        }
    }
}

module.exports = Command
