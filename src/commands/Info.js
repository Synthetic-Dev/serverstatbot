const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "info",
            desc: "Displays current information about the server",
            aliases: [
                "serverinfo"
            ]
        })
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]

        const ip = await settings.getSetting("ip")
        const port = await settings.getSetting("port")

        Util.request(`https://api.mcsrvstat.us/2/${ip}:${port}.tld`, (success, data) => {
            if (!success) {
                Util.replyError(message, `An error occured, please contact the developer\n\nYou can join our support server here: https://discord.gg/uqVp2XzUP8`)
            } else {
                success = false
                try {
                    data = JSON.parse(data)
                    success = true
                } catch(e) {
                    console.error(e)
                }
                
                if (!success) return Util.replyError(message, "An error occured when trying to gather server info")
                if (!data.ip || !data.port) return Util.replyError(message, "An invalid ip or port is set");
                if (!data.online) {
                    return Util.sendMessage(message, {
                        embed: {
                            title: "Server Info",
                            description: `Address: **${ip}:${port}**\nOnline: **${data.online && "Yes" || "No"}**`,
                            color: 5145560
                        }
                    })
                }

                Util.sendMessage(message, {
                    embed: {
                        title: "Server Info",
                        description: `Address: **${data.hostname || data.ip}:${data.port}**\nOnline: **${data.online && "Yes" || "No"}**`,
                        color: 5145560,
                        fields: [
                            {
                                name: "Minecraft Version:",
                                value: data.version
                            },
                            {
                                name: "Minecraft Type:",
                                value: data.mods ? "Modded" : "Vanilla"
                            },
                            {
                                name: "MOTD:",
                                value: data.motd.clean
                            },
                            {
                                name: "Players Online:",
                                value: `${data.players.online}/${data.players.max}`
                            }
                        ]
                    }
                })
            }
        })
    }
}

module.exports = Command