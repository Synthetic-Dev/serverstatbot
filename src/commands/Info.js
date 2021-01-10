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

    async getServerInfo(message, callback) {
        const settings = this.client.settings[message.guild.id]

        Util.request(`https://api.mcsrvstat.us/2/${await settings.getSetting("ip")}:${await settings.getSetting("port")}.tld`, (success, data) => {
            if (!success) {
                Util.replyError(message, `An error occured, please contact developer\n\n${data.message}`)
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
                    try {
                        message.reply("Server is not online")
                    } catch(e) {console.error(e)}

                    return
                }

                callback(data)
            }
        })
    }

    async execute(message) {
        this.getServerInfo(message, data => {
            try {
                message.channel.send({
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
            } catch(e) {console.error(e)}
        })
    }
}

module.exports = Command