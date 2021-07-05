const Crypto = require("crypto")
const Discord = require("discord.js")

const Util = require("../utils/Util")
const Protocol = require("../utils/Protocol")
const CommandBase = require("../classes/CommandBase")
const Mojang = require("../utils/Mojang")
const ImageManager = require("../classes/ImageManager")

const playerListCache = ImageManager.getManager("playerlists")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "players",
            descId: "COMMAND_PLAYERS",
            aliases: ["getplayers", "plrs"],
            tags: ["CAN_DISABLE"],
        })
    }

    async execute(options) {
        const serverData = await options.settings.get("server")

        Util.startTyping(options.message).catch((e) => {
            Util.error(e, "Players", "startTyping")
        })

        Protocol.getInfo(serverData.Ip, serverData.Port, serverData.QueryPort)
            .then(async (data) => {
                Util.stopTyping(options.message)

                if (data.online) {
                    if (data.players.online == 0)
                        return Util.sendMessage(
                            options.message,
                            options.lang.SERVER_EMPTY
                        ).catch((e) => {
                            Util.error(e, "Players", "sendMessage1")
                        })

                    const embed = new Discord.MessageEmbed()
                        .setDescription(
                            options.lang.SERVER_PLAYERS.format(
                                data.players.online,
                                data.players.max
                            ) +
                                (!data.query
                                    ? "\n" + options.lang.SERVER_NOQUERY
                                    : "") +
                                (data.bedrock
                                    ? "\n:warning: " +
                                      options.lang.SERVER_BEDROCK
                                    : "")
                        )
                        .setColor(5145560)
                        .setTimestamp()

                    const hash = Crypto.createHash("md5")
                    data.players.sample.forEach((player) => {
                        hash.update(player.name.clean)
                    })
                    const playerListKey = hash.digest("hex")

                    let playerListLink = playerListCache.get(playerListKey)
                    if (!playerListLink) {
                        if (
                            !data.players.sample ||
                            data.players.sample.length == 0
                        ) {
                            const embed = new Discord.MessageEmbed()
                                .setDescription(
                                    options.lang.SERVER_PLAYERS.format(
                                        data.players.online,
                                        data.players.max
                                    ) +
                                        "\n\n" +
                                        options.lang.COMMAND_PLAYERS_TOOMANY
                                )
                                .setColor(5145560)
                                .setTimestamp()

                            return Util.sendMessage(options.message, {
                                embed: embed,
                            }).catch((e) => {
                                Util.error(e, "Players", "sendMessage2")
                            })
                        }

                        playerListLink = "attachment://playerlist.png"

                        let image = await Mojang.generatePlayerList(
                            data.players.sample,
                            options.lang,
                            30,
                            7,
                            256
                        )
                        embed.attachFiles([
                            {
                                attachment: image.toBuffer("image/png"),
                                name: "playerlist.png",
                            },
                        ])
                    }

                    embed.setImage(playerListLink)

                    Util.sendMessage(options.message, embed).catch((e) => {
                        Util.error(e, "Players", "sendMessage2")
                    })
                } else {
                    let error = data.error
                    let errorText

                    switch (Protocol.getErrorType(error)) {
                        case "offline":
                            Util.replyMessage(
                                options.message,
                                options.lang.SERVER_OFFLINE
                            ).catch((e) => {
                                Util.error(e, "Players", "replyMessage")
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
                                `Players[error]: ${error.toString()};\n${
                                    error.method
                                } at ${error.path}`
                            )
                    }

                    if (errorText) Util.replyError(options.message, errorText)
                }
            })
            .catch((e) => {
                Util.error(e, "Players", "getInfo")
            })
    }
}

module.exports = Command
