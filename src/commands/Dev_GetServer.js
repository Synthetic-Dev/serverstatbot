const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "devgetserver",
            desc: "View a connected server and its details",
            aliases: [
                "dgetserver",
                "dgetsrv"
            ],
            args: [
                {
                    name: "search"
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async getServer(guild, check) {
        if (check && !check(guild)) return;

        const settings = this.client.settings[guild.id]
        
        let logchannel = await settings.getSetting("logchannel")

        return {
            embed: {
                author: {
                    name: guild.name,
                    icon_url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                },
                description: `**Owner:** \`\`${guild.owner.user.tag}\`\`\n\nSettings:\n• **Prefix:** \`\`${await settings.getSetting("prefix")}\`\`\n• **Ip:** \`\`${await settings.getSetting("ip")}\`\`\n• **Port:** \`\`${await settings.getSetting("port")}\`\`\n• **Log channel:** ${logchannel == "0" ? "None" : `<#${await settings.getSetting("logchannel")}>`}`,
                color: 5145560
            }
        }
    }

    async execute(message, inputs) {
        
    }
}

module.exports = Command