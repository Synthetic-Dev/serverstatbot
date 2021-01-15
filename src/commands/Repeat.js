const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "repeat",
            desc: "",
            aliases: [
                "re"
            ],
            args: [
                {
                    name: "text"
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(message, inputs) {
        try {
            message.delete()
        } catch(e) {
            console.error(e)
        }
        
        if (!Util.doesMemberHavePermission(message.guild.me, ["MANAGE_MESSAGES"])) return Util.replyError(message, ":tired_face: Sorry");

        Util.sendMessage(message.channel, inputs[0])
        try {
            message.delete()
        } catch(e) {
            console.error(e)
        }
    }
}

module.exports = Command