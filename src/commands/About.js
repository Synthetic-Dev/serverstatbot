const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "about",
            desc: "Information about the bot",
            aliases: [
                "abt"
            ]
        })
    }

    async execute(inputs, message) {
        try {
            message.channel.send({
                embed: {
                    title: "About",
                    author: {
                        name: this.client.user.username,
                        icon_url: this.client.user.avatarURL({
                            size: 64,
                            dynamic: true,
                            format: "png"
                        })
                    },
                    color: 5145560,
                    fields: [
                        {
                            name: "Version",
                            value: process.env.npm_package_version,
                            inline: true
                        },
                        {
                            name: "Developed by",
                            value: "SyntheticDev",
                            inline: true
                        },
                        {
                            name: "Credit to",
                            value: "[api.mcsrvstat.us](https://api.mcsrvstat.us/)\n[mc-heads.net](https://mc-heads.net/)",
                            inline: true
                        },
                        {
                            name: "Servers",
                            value: this.client.guilds.cache.size
                        },
                        {
                            name: "Users",
                            value: this.client.users.cache.size,
                            inline: true
                        },
                        {
                            name: "Invite",
                            value: "[Invite bot](https://discord.com/oauth2/authorize?client_id=759415210628087841&scope=bot%20identify%20guilds&permissions=1275587792)"
                        }
                    ]
                }
            })
        } catch(e) {console.error(e)}
    }
}

module.exports = Command