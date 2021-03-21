const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "settings",
            desc: "Gets the current server settings",
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]
        
        let logchannel = await settings.get("logchannel")
        let disabledCommands = await settings.get("disabledCommands")

        Util.sendMessage(message, {
            embed: {
                title: "Settings",
                description: `• **Prefix:** \`\`${await settings.get("prefix")}\`\`\n• **Ip:** \`\`${await settings.get("ip")}\`\`\n• **Port:** \`\`${await settings.get("port")}\`\`\n• **Log channel:** ${logchannel == "0" ? "None" : `<#${await settings.get("logchannel")}>`}\n• **Disabled commands:** \`\`${disabledCommands.length > 0 ? disabledCommands.join("``, ``") : "None"}\`\``,
                color: 16760391,
                footer: Util.getFooter(this.client)
            }
        }).catch(console.error)
    }
}

module.exports = Command