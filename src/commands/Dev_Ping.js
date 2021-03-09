const Canvas = require("canvas")
const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "devpingserver",
            desc: "Pings a server with the given details",
            aliases: [
                "dping"
            ],
            args: [
                {
                    name: "address",
                    desc: "The address of the server e.g. ``mc.hypixel.net``, ``play.hivemc.net:25565`` or ``172.16.254.1:25665``"
                }
            ]
        })
    }

    async execute(message, inputs) {
        let [ip, port] = inputs[0].split(":")
        port = port ? port : 25565

        let maxPort = 32768
        port = Number(port)
        if (typeof(port) != "number" || port == null || isNaN(port)) return Util.replyError(message, "Port must be a number");

        port = Math.abs(port)
        if (port > maxPort) return Util.replyError(message, `Port cannot exceed ${maxPort}`)

        let promise = Util.sendMessage(message.channel, ":arrows_counterclockwise: Pinging server...")
        if (!promise) return;
        let botMessage = await promise

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

                fields.push({
                    name: "Debug Info:",
                    value: `Ping: ${data.ping}\nQuery: ${data.query}\nCached: ${data.cached}\nBedrock: ${data.bedrock}\nModded: ${data.modded}\nSrvRecord: ${JSON.stringify(data.srvRecord)}\nProtocol: ${data.version.protocol}`
                })

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

                if (data.favicon) {
                    let image = Canvas.createCanvas(64, 64)
                    let context = image.getContext("2d")

                    let favicon = new Canvas.Image()
                    favicon.onload = () => {
                        context.drawImage(favicon, 0, 0)

                        content.files = [{
                            attachment: image.toBuffer("image/png"),
                            name: "favicon.png"
                        }]
                        content.embed.thumbnail = {
                            url: "attachment://favicon.png"
                        }

                        Util.sendMessage(message, content)
                    }
                    favicon.src = data.favicon
                } else {
                    Util.sendMessage(message, content)
                }
            } else {
                let error = data.error

                if (["Failed to retrieve the status of the server within time", "Failed to query server within time"].includes(error.toString()) || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                    return Util.sendMessage(message, {
                        embed: {
                            title: "Server Info",
                            description: `Address: **${ip}:${port}**\nStatus: <:red_circle_with_cross:818512512764084265> **Offline**${error == "Failed to query server within time" ? "\nIf the server is online is ``enable-status=true`` or ``enabled-query=true``" : ""}`,
                            color: 5145560,
                            fields: [
                                {
                                    name: "Debug Info:",
                                    value: `Error: ${error.toString()}`
                                }
                            ]
                        }
                    })
                } else if (error.code == "ENOTFOUND") {
                    return Util.replyError(message, "Could not find server, check that a valid ip and port is set, and is the server running a supported version?");
                }
                
                Util.replyError(message, `An error occured, please contact the developer\nYou can join our support server here: discord.gg/uqVp2XzUP8`)
                console.error(error)
            }
        })
    }
}

module.exports = Command