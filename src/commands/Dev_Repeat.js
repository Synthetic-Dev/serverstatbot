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
            private: true,
            secret: true
        })
    }

    async execute(message, inputs) {
        let channel = message.channel
        let me = message.guild.me

        if (!Util.doesMemberHavePermission(me, ["SEND_MESSAGES", "MANAGE_MESSAGES"])) return Util.sendError(channel, ":tired_face: Sorry");

        try {
            message.delete()
        } catch(e) {
            console.error(e)
        }
        
        Util.sendMessage(channel, inputs[0])
    }
}

module.exports = Command