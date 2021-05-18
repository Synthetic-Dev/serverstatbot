const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "leave",
            descId: "COMMAND_DEV_LEAVE",
            args: [
                {
                    name: "server",
                    descId: "COMMAND_DEV_LEAVE_ARG1"
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(options) {
        Util.getGuildById(this.client, options.inputs[0]).then(guild => {
            guild.leave().then(() => {
                Util.replyMessage(options.message, `Successfully left guild \`\`${guild.name}\`\``)
            }).catch(err => {
                Util.replyError(options.message, "Error while leaving guild")
                console.error(err)
            })
        }).catch(err => {
            Util.replyError(options.message, "Error while getting guild")
            console.error(err)
        })
    }
}

module.exports = Command