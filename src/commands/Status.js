const Crypto = require("crypto")
const Canvas = require("canvas")
const Discord = require("discord.js")

const Util = require("../utils/Util")
const Protocol = require("../utils/Protocol")
const Mojang = require("../utils/Mojang")
const ImageManager = require("../classes/ImageManager")

const CommandBase = require("../classes/CommandBase")

const LocalSettings = require("../localSettings.json")

const motdCache = ImageManager.getManager("motds")
const faviconCache = ImageManager.getManager("favicons", 3600)

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "status",
            descId: "COMMAND_STATUS",
            aliases: ["info", "serverinfo"],
            tags: ["CAN_DISABLE"],
        })
    }

    displayInfo(options, displayOptions, additionals) {
        Util.startTyping(options.message).catch((e) => {
            Util.error(e, "Status", "startTyping")
        })

        Protocol.getInfo(
            displayOptions.ip,
            displayOptions.port,
            displayOptions.queryPort
        )
            .then((data) => {
                Util.stopTyping(options.message)

                if (data.online) {
                    let fields = [
                        {
                            name: options.lang.COMMAND_STATUS_FIELD1,
                            value:
                                data.version.minecraft ??
                                options.lang.NOT_PROVIDED,
                        },
                        {
                            name: options.lang.COMMAND_STATUS_FIELD2,
                            value:
                                (data.bedrock
                                    ? options.lang.BEDROCK
                                    : data.modded
                                    ? options.lang.MODS.format(
                                          data.mods.modList.length
                                      )
                                    : options.lang.VANILLA) +
                                (data.plugins && data.plugins.length > 0
                                    ? " " +
                                      options.lang.PLUGINS.format(
                                          data.plugins.length
                                      )
                                    : ""),
                        },
                    ]

                    if (data.levelName) {
                        fields.unshift({
                            name: options.lang.COMMAND_STATUS_FIELD3,
                            value: data.levelName,
                        })
                    }

                    if (additionals) {
                        additionals(data, fields)
                    }

                    const embed = new Discord.MessageEmbed()
                        .setTitle(
                            options.lang.COMMAND_STATUS_TITLE.format(
                                data.bedrock
                                    ? `(${options.lang.BEDROCK})`
                                    : `(${options.lang.JAVA})`
                            )
                        )
                        .setDescription(
                            options.lang.COMMAND_STATUS_DESC.format(
                                displayOptions.ip +
                                    ([19132, 25565].includes(
                                        displayOptions.port
                                    )
                                        ? ""
                                        : `:${displayOptions.port}`),
                                data.latency > 0
                                    ? `\n${options.lang.SERVER_LATENCY.format(
                                          data.latency
                                      )}`
                                    : "",
                                data.players.online,
                                data.players.max,
                                data.gameMode
                                    ? `\n${options.lang.SERVER_GAMEMODE.format(
                                          data.gameMode
                                      )}`
                                    : data.gameType
                                    ? `\n${options.lang.SERVER_GAMETYPE.format(
                                          data.gameType
                                      )}`
                                    : "",
                                data.serverID
                                    ? `\n${options.lang.SERVER_SEED.format(
                                          data.serverID
                                      )}`
                                    : ""
                            )
                        )
                        .setColor(5145560)
                        .addFields(fields)
                        .setTimestamp()

                    const hash = Crypto.createHash("md5")
                    hash.update(data.motd.raw)
                    const motdKey = hash.digest("hex")

                    let motdLink = motdCache.get(motdKey)
                    if (motdLink) {
                        motdCache.ttl(motdKey, 600)
                    } else {
                        motdLink = "attachment://motd.png"

                        let motd = Mojang.generateMOTD(data.motd.raw, 4, 10)

                        embed.attachFiles([
                            {
                                attachment: motd.toBuffer("image/png"),
                                name: "motd.png",
                            },
                        ])
                    }

                    embed.setImage(motdLink)

                    //console.log(data.favicon)

                    let faviconLink
                    if (data.favicon) {
                        const hash = Crypto.createHash("md5")
                        hash.update(data.favicon)
                        const faviconKey = hash.digest("hex")

                        faviconLink = faviconCache.get(faviconKey)
                        if (faviconLink) {
                            faviconCache.ttl(faviconKey, 3600)

                            embed.setThumbnail(faviconLink)
                            return Util.sendMessage(
                                options.message,
                                embed
                            ).catch((e) => {
                                Util.error(e, "Status", "sendMessage1")
                            })
                        }

                        faviconLink = "attachment://favicon.png"

                        let image = Canvas.createCanvas(64, 64)
                        let context = image.getContext("2d")
                        context.imageSmoothingEnabled = false

                        let favicon = new Canvas.Image()
                        favicon.onload = () => {
                            context.drawImage(favicon, 0, 0, 64, 64)

                            embed.attachFiles([
                                {
                                    attachment: image.toBuffer("image/png"),
                                    name: "favicon.png",
                                },
                            ])
                            embed.setThumbnail(faviconLink)
                            Util.sendMessage(options.message, embed).catch(
                                (e) => {
                                    Util.error(e, "Status", "sendMessage2")
                                }
                            )
                        }
                        favicon.onerror = () => {
                            Util.sendMessage(options.message, embed).catch(
                                (e) => {
                                    Util.error(e, "Status", "sendMessage3")
                                }
                            )
                        }
                        favicon.src = data.favicon
                    } else {
                        if (data.bedrock)
                            faviconLink = LocalSettings.images.textures.bedrock
                        else faviconLink = LocalSettings.images.textures.grass

                        embed.setThumbnail(faviconLink)
                        Util.sendMessage(options.message, embed).catch((e) => {
                            Util.error(e, "Status", "sendMessage4")
                        })
                    }
                } else {
                    let error = data.error
                    let errorText

                    switch (Protocol.getErrorType(error)) {
                        case "offline":
                            const embed = new Discord.MessageEmbed()
                                .setTitle(
                                    options.lang.COMMAND_STATUS_TITLE.format(
                                        ""
                                    ).trim()
                                )
                                .setDescription(
                                    options.lang.COMMAND_STATUS_FAIL_DESC.format(
                                        displayOptions.ip,
                                        displayOptions.port,
                                        error.message.includes(
                                            "Failed to query server"
                                        )
                                            ? "\n" +
                                                  options.lang.SERVER_IFONLINE
                                            : ""
                                    )
                                )
                                .setColor(5145560)
                                .setTimestamp()

                            Util.sendMessage(options.message, {
                                embed: embed,
                            }).catch((e) => {
                                Util.error(e, "Status", "sendMessage5")
                            })
                            break
                        case "notfound":
                            errorText = options.lang.SERVER_COULDNOTFIND
                            break
                        case "badport":
                            errorText = options.lang.SERVER_WRONGPORT
                            break
                        case "blocked":
                            errorText = options.lang.SERVER_BLOCKED
                            break
                        default:
                            errorText = options.lang.SERVER_ERROR
                            console.error(
                                `Status[error]: ${error.toString()};\n${
                                    error.method
                                } at ${error.path}`
                            )
                    }

                    if (errorText) Util.replyError(options.message, errorText)
                }
            })
            .catch((e) => {
                Util.error(e, "Status", "getInfo")
            })
    }

    async execute(options) {
        const serverData = await options.settings.get("server")

        this.displayInfo(options, {
            ip: serverData.Ip,
            port: serverData.Port,
            queryPort: serverData.QueryPort,
        })
    }
}

module.exports = Command
