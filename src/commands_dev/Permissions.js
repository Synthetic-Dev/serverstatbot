const Discord = require("discord.js")

const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "permissions",
            descId: "COMMAND_DEV_PERMISSIONS",
            aliases: ["perms"],
            perms: ["DEV"],
            private: true,
        })
    }

    async execute(options) {
        const embed = new Discord.MessageEmbed()
            .setTitle("Permissions")
            .setDescription(
                "``" +
                    options.guild.me.permissions.toArray().join("`, `") +
                    "``"
            )
            .setColor(4317012)
            .setTimestamp()

        Util.sendMessage(options.message, embed).catch((e) => {
            Util.error(e, "Dev_Permissions", "sendMessage")
        })
    }
}

module.exports = Command
