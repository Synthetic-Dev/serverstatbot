const Crypto = require("crypto")

const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")
const Mojang = require("../utils/mojang.js")
const ImageManager = require("../utils/managers/imageManager.js")

const playerListCache = ImageManager.getManager("playerlists")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "players",
            descId: "COMMAND_PLAYERS",
            aliases: [
                "getplayers",
                "plrs"
            ],
            tags: [
                "CAN_DISABLE"
            ]
        })
    }

    async execute(options) {
        const serverData = await options.settings.get("server")

        Util.startTyping(options.message).catch(e => {
            console.error(`Players[startTyping]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })

        Protocol.getInfo(serverData.Ip, serverData.Port, serverData.QueryPort).then(async data => {
            Util.stopTyping(options.message)

            if (data.online) {
                if (data.players.online == 0) return Util.sendMessage(options.message, options.lang.SERVER_EMPTY).catch(e => {
                    console.error(`Players[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                });

                let content = {
                    embed: {
                        description: options.lang.SERVER_PLAYERS.format(data.players.online, data.players.max) + (!data.query ? "\n" + options.lang.SERVER_NOQUERY : "") + (data.bedrock ? "\n:warning: " + options.lang.SERVER_BEDROCK : ""),
                        color: 5145560,
                        timestamp: Date.now()
                    }
                }

                let hash = Crypto.createHash("md5")
                data.players.sample.forEach(player => {
                    hash.update(player.name.clean)
                })
                const playerListKey = hash.digest("hex")

                let playerListLink = playerListCache.get(playerListKey)
                if (!playerListLink) {
                    if (!data.players.sample || data.players.sample.length == 0) {
                        return Util.sendMessage(options.message, {
                            embed: {
                                description: options.lang.SERVER_PLAYERS.format(data.players.online, data.players.max) + "\n\n" + options.lang.COMMAND_PLAYERS_TOOMANY,
                                color: 5145560,
                                timestamp: Date.now()
                            }
                        }).catch(e => {
                            console.error(`Players[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                        })
                    }
                    
                    playerListLink = "attachment://playerlist.png"

                    let image = await Mojang.generatePlayerList(data.players.sample, options.lang, 30, 7, 256)
                    content.files = [{
                        attachment: image.toBuffer("image/png"),
                        name: "playerlist.png"
                    }]
                }

                content.embed.image = {
                    url: playerListLink
                }

                Util.sendMessage(options.message, content).catch(e => {
                    console.error(`Players[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                })
            } else {
                let error = data.error
                let errorText

                switch(Protocol.getErrorType(error)) {
                    case "offline":
                        Util.replyMessage(options.message, options.lang.SERVER_OFFLINE).catch(e => {
                            console.error(`Players[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                        })
                        break
                    case "notfound": errorText = options.lang.SERVER_COULDNOTFIND; break;
                    case "badport": errorText = options.lang.SERVER_WRONGPORT; break;
                    case "blocked": errorText = options.lang.SERVER_BLOCKED; break;
                    default:
                        errorText = options.lang.SERVER_ERROR
                        console.error(`Players[error]: ${error.toString()};\n${error.method} at ${error.path}`)
                }

                if (errorText) Util.replyError(options.message, errorText);
            }
        }).catch(e => {
            console.error(`Players[getInfo]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command