const discord = require("discord.js")
const util = require("../util.js")

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

        util.request(`https://api.mcsrvstat.us/2/${await settings.getSetting("ip")}:${await settings.getSetting("port")}.tld`, true, (success, data) => {
            if (!success) {
                message.reply(`An error occured, please contact developer\n\n${data.message}`)
            } else {
                data = JSON.parse(data)
                if (!data.ip || !data.port) return message.reply("An invalid ip or port is set");
                if (!data.online) return message.reply("Server is not online");

                callback(data)
            }
        })
    }

    async execute(inputs, message) {
        this.getServerInfo(message, data => {
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
        })
    }
}

module.exports = Command