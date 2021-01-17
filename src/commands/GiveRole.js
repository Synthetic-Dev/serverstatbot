const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "giverole",
            desc: "",
            aliases: [
                "gr"
            ],
            args: [
                {
                    name: "role"
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(message, inputs) {
        if (!Util.doesMemberHavePermission(message.guild.me, ["MANAGE_ROLES"])) return Util.replyError(message, ":tired_face: Sorry");

        let role = Util.parseRole(message.guild, inputs[0])

        if (role) {
            try {
                await message.member.roles.add(role)
            } catch(e) {
                console.error(e)
            }

            Util.replyMessage(message, ":+1: Duty executed.")
        } else {
            Util.replyMessage(message, ":-1: Mission failed, we'll get'em next time.")
        }
    }
}

module.exports = Command