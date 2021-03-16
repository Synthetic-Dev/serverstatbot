const Canvas = require("canvas")
const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "info",
            desc: "Displays current information about the server",
            aliases: [
                "serverinfo"
            ]
        })
    }

    displayInfo(message, ip, port, additionals) {
        Util.sendMessage(message.channel, ":arrows_counterclockwise: Pinging server...").then(botMessage => {
            Protocol.getInfo(ip, port).then(data => {
                try {
                    botMessage.delete()
                } catch(e) {console.error(e)}
    
                if (data.online) {
                    let fields = [
                        {
                            name: "MOTD:",
                            value: data.motd.clean
                        },
                        {
                            name: "Minecraft Version:",
                            value: data.version.minecraft
                        },
                        {
                            name: "Minecraft Type:",
                            value: (data.bedrock ? "Bedrock" : (data.modded ? `Modded (${data.mods.modList.length} mods)` : "Vanilla")) + (data.plugins && data.plugins.length > 0 ? ` (${data.plugins.length} plugins)` : "")
                        }
                    ]

                    if (additionals) {
                        additionals(data, fields)
                    }
    
                    let content = {
                        embed: {
                            title: "Server Info " + (data.bedrock ? "(Bedrock)" : "(Java)"),
                            description: `Address: **${ip}${port != 25565 ? `:${port}` : ""}**\nStatus: <:green_circle_with_tick:818512512500105249> **Online**${data.latency > 0 ? `\nLatency: **${data.latency}ms**` : ""}\nPlayers: **${data.players.online}/${data.players.max}**`,
                            color: 5145560,
                            thumbnail: {
                                url: "attachment://favicon.png"
                            },
                            fields: fields
                        }
                    }
    
                    let image = Canvas.createCanvas(64, 64)
                    let context = image.getContext("2d")
                    context.imageSmoothingEnabled = false

                    let favicon = new Canvas.Image()
                    favicon.onload = () => {
                        context.drawImage(favicon, 0, 0, 64, 64)

                        content.files = [{
                            attachment: image.toBuffer("image/png"),
                            name: "favicon.png"
                        }]
                        content.embed.thumbnail = {
                            url: "attachment://favicon.png"
                        }

                        Util.sendMessage(message, content)
                    }
                    if (data.favicon) {
                        favicon.src = data.favicon
                    } else {
                        if (data.bedrock) favicon.src = `${__dirname}/../../assets/textures/bedrock.png`;
                        else favicon.src = `${__dirname}/../../assets/textures/grass.png`
                    }
                } else {
                    let error = data.error
    
                    if (["Failed to retrieve the status of the server within time", "Failed to query server within time"].includes(error.toString()) || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                        return Util.sendMessage(message, {
                            embed: {
                                title: "Server Info",
                                description: `Address: **${ip}:${port}**\nStatus: <:red_circle_with_cross:818512512764084265> **Offline**${error == "Failed to query server within time" ? "\nIf the server is online, check that ``enable-status=true`` or ``enabled-query=true``" : ""}`,
                                color: 5145560
                            }
                        })
                    } else if (error.code == "ENOTFOUND") {
                        return Util.replyError(message, "Could not find server, check that a valid ip and port is set, and is the server running a supported version?");
                    }
                    
                    Util.replyError(message, `An error occured, please contact the developer\nYou can join our support server here: discord.gg/uqVp2XzUP8`)
                    console.error(error)
                }
            }).catch(e => {})
        }).catch(e=>{})
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]

        const ip = await settings.get("ip")
        const port = await settings.get("port")

        this.displayInfo(message, ip, port)
    }
}

module.exports = Command