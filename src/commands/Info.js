const Canvas = require("canvas")
const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
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

        //if (!data.ip || !data.port) return Util.replyError(message, "An invalid ip or port is set");

        let promise = Util.sendMessage(message.channel, ":arrows_counterclockwise: Pinging server...")
        if (!promise) return;
        let botMessage = await promise

        Protocol.ping(ip, port).then(data => {
            try {
                botMessage.delete()
            } catch(e) {console.error(e)}

            let image = Canvas.createCanvas(64, 64)
            let context = image.getContext("2d")

            let favicon = new Canvas.Image()
            favicon.onload = () => {
                context.drawImage(favicon, 0, 0)

                Util.sendMessage(message, {
                    files: [{
                        attachment: image.toBuffer("image/png"),
                        name: "favicon.png"
                    }],
                    embed: {
                        title: "Server Info",
                        description: `Address: **${ip}${port != 25565 ? `:${port}` : ""}**\nStatus: :white_check_mark: **Online**\nLatency: **${data.latency}ms**`,
                        color: 5145560,
                        thumbnail: {
                            url: "attachment://favicon.png"
                        },
                        fields: [
                            {
                                name: "Minecraft Version:",
                                value: data.version.name
                            },
                            {
                                name: "Minecraft Type:",
                                value: data.forgeData ? `Modded (${data.forgeData.mods.length} mods)` : "Vanilla"
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
            favicon.src = data.favicon
        }).catch(error => {
            try {
                botMessage.delete()
            } catch(e) {console.error(e)}

            if (error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                return Util.sendMessage(message, {
                    embed: {
                        title: "Server Info",
                        description: `${error.code == "ECONNREFUSED" ? ":warning: Server refused connection is ``enable-query=true``?\n" : ""}Address: **${ip}:${port}**\nStatus: :octagonal_sign: **Offline**`,
                        color: 5145560
                    }
                })
            } else if (error.code == "ENOTFOUND") {
                return Util.replyError(message, "An invalid ip or port is set");
            }

            Util.replyError(message, `An error occured, please contact the developer\n\nYou can join our support server here: https://discord.gg/uqVp2XzUP8`)
            console.error(error)
        })
    }
}

module.exports = Command