const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "leave",
            descId: "COMMAND_DEV_LEAVE",
            args: [
                {
                    name: "server",
                    descId: "COMMAND_DEV_LEAVE_ARG1",
                },
            ],
            perms: ["DEV"],
            private: true,
        })
    }

    async execute(options) {
        Util.getGuildById(this.client, options.inputs[0])
            .then((guild) => {
                guild
                    .leave()
                    .then(() => {
                        Util.replyMessage(
                            options.message,
                            `Successfully left guild \`${guild.name}\``
                        )
                    })
                    .catch((err) => {
                        Util.replyError(
                            options.message,
                            "Error while leaving guild"
                        )
                        console.error(err)
                    })
            })
            .catch((e) => {
                Util.replyError(options.message, "Error while getting guild")
                Util.error(e, "Dev_Leave", "getGuildById")
            })
    }
}

module.exports = Command
