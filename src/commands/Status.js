const Canvas = require("canvas")
const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "status",
            desc: "Displays current information about the server",
            aliases: [
                "info",
                "serverinfo"
            ],
            tags: [
                "CAN_DISABLE"
            ]
        })
    }

    displayInfo(message, ip, port, additionals) {
        Util.startTyping(message).catch(e => {
            console.error(`Status[startTyping]: ${e.toString()};\n${e.method} at ${e.path}`)
        })

        Protocol.getInfo(ip, port).then(data => {
            Util.stopTyping(message)

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
                        fields: fields,
                        timestamp: Date.now()
                    }
                }

                /*
                let motd = Canvas.createCanvas(512, 64)
                let context = motd.getContext("2d")
                context.imageSmoothingEnabled = false
                context.font = "20px 'Pixel Font'"
                context.textBaseline = "top"
                context.textAlign = "left"
                context.fillStyle = "#fff"
                */

                /*
                ansiMap.set('0', ansi_styles_1.default.black);
ansiMap.set('1', ansi_styles_1.default.blue);
ansiMap.set('2', ansi_styles_1.default.green);
ansiMap.set('3', ansi_styles_1.default.cyan);
ansiMap.set('4', ansi_styles_1.default.red);
ansiMap.set('5', ansi_styles_1.default.magenta);
ansiMap.set('6', ansi_styles_1.default.yellow);
ansiMap.set('7', ansi_styles_1.default.gray);
ansiMap.set('8', ansi_styles_1.default.blackBright);
ansiMap.set('9', ansi_styles_1.default.blueBright);
ansiMap.set('a', ansi_styles_1.default.greenBright);
ansiMap.set('b', ansi_styles_1.default.cyanBright);
ansiMap.set('c', ansi_styles_1.default.redBright);
ansiMap.set('d', ansi_styles_1.default.magentaBright);
ansiMap.set('e', ansi_styles_1.default.yellowBright);
ansiMap.set('f', ansi_styles_1.default.whiteBright);
ansiMap.set('k', ansi_styles_1.default.reset);
ansiMap.set('l', ansi_styles_1.default.bold);
ansiMap.set('m', ansi_styles_1.default.strikethrough);
ansiMap.set('n', ansi_styles_1.default.underline);
ansiMap.set('o', ansi_styles_1.default.italic);
ansiMap.set('r', ansi_styles_1.default.reset);
                */

                content.files = []

                /*
                console.log(data.motd)

                content.files.push({
                    attachment: motd.toBuffer("image/png"),
                    name: "motd.png"
                })

                content.embed.image = {
                    url: "attachment://motd.png"
                }*/

                let image = Canvas.createCanvas(64, 64)
                let context = image.getContext("2d")
                context.imageSmoothingEnabled = false

                let favicon = new Canvas.Image()
                favicon.onload = () => {
                    context.drawImage(favicon, 0, 0, 64, 64)

                    content.files.push({
                        attachment: image.toBuffer("image/png"),
                        name: "favicon.png"
                    })
                    content.embed.thumbnail = {
                        url: "attachment://favicon.png"
                    }

                    Util.sendMessage(message, content).catch(e => {
                        console.error(`Status[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                }
                favicon.onerror = () => {
                    Util.sendMessage(message, content).catch(e => {
                        console.error(`Status[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                }
                if (data.favicon) {
                    favicon.src = data.favicon
                } else {
                    if (data.bedrock) favicon.src = `${__dirname}/../../assets/textures/bedrock.png`;
                    else favicon.src = `${__dirname}/../../assets/textures/grass.png`
                }
            } else {
                let error = data.error

                if (["Failed to retrieve the status of the server within time", "Failed to query server within time"].includes(error.message) || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                    return Util.sendMessage(message, {
                        embed: {
                            title: "Server Info",
                            description: `Address: **${ip}:${port}**\nStatus: <:red_circle_with_cross:818512512764084265> **Offline**${error.message == "Failed to query server within time" ? "\nIf the server is online, check that ``enable-status=true`` or ``enabled-query=true``" : ""}`,
                            color: 5145560,
                            timestamp: Date.now()
                        }
                    }).catch(e => {
                        console.error(`Status[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                } else if (error.code == "ENOTFOUND") {
                    return Util.replyError(message, "Could not find server, check that a valid ip and port is set, and is the server running a supported version?");
                }
                
                Util.replyError(message, `An error occured, please contact the developer\nYou can join our support server here: discord.gg/uqVp2XzUP8`)
                console.error(`Status[error]: ${error.toString()};\n${error.method} at ${error.path}`)
            }
        }).catch(e => {
            console.error(`Status[getInfo]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]

        const ip = await settings.get("ip")
        const port = await settings.get("port")

        this.displayInfo(message, ip, port)
    }
}

module.exports = Command