const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "settings",
            desc: "Gets your current server settings",
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]
        
        let logchannel = await settings.getSetting("logchannel")

        Util.sendMessage(message, {
            embed: {
                title: "Settings",
                description: `• **Prefix:** \`\`${await settings.getSetting("prefix")}\`\`\n• **Ip:** \`\`${await settings.getSetting("ip")}\`\`\n• **Port:** \`\`${await settings.getSetting("port")}\`\`\n• **Log channel:** ${logchannel == "0" ? "None" : `<#${await settings.getSetting("logchannel")}>`}`,
                footer: Util.getFooter(this.client)
            }
        })
    }
}

module.exports = Command