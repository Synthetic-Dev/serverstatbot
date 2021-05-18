const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")
const Mojang = require("../utils/mojang.js")
const ImageManager = require("../utils/imageManager.js")

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
            console.error(`Players[startTyping]: ${e.toString()};\n${e.method} at ${e.path}`)
        })

        Protocol.getInfo(serverData.Ip, serverData.Port, serverData.QueryPort).then(async data => {
            Util.stopTyping(options.message)

            if (data.online) {
                if (data.players.online == 0) return Util.sendMessage(options.message, options.lang.SERVER_EMPTY).catch(e => {
                    console.error(`Players[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                });

                let content = {
                    embed: {
                        description: options.lang.SERVER_PLAYERS.format(data.players.online, data.players.max) + (!data.query ? "\n" + options.lang.SERVER_NOQUERY : "") + (data.bedrock ? "\n:warning: " + options.lang.SERVER_BEDROCK : ""),
                        color: 5145560,
                        timestamp: Date.now()
                    }
                }

                let playerListKey = ""
                data.players.sample.forEach(player => {
                    playerListKey += player.name.clean
                })

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
                            console.error(`Players[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
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
                    console.error(`Players[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                })
            } else {
                let error = data.error

                if (["Failed to retrieve the status of the server within time", "Failed to query server within time"].includes(error.message) || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                    return Util.replyMessage(options.message, options.lang.SERVER_OFFLINE).catch(e => {
                        console.error(`Players[replyMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                } else if (error.code == "ENOTFOUND") {
                    return Util.replyError(options.message, options.lang.SERVER_COULDNOTFIND);
                } else if (error.message == "Server sent an invalid packet type") {
                    return Util.replyError(options.message, options.lang.SERVER_WRONGPORT)
                } else if (error.message == "Blocked host") {
                    return Util.replyError(options.message, options.lang.SERVER_BLOCKED);
                }
                
                Util.replyError(options.message, options.lang.SERVER_ERROR)
                console.error(`Players[error]: ${error.toString()};\n${error.method} at ${error.path}`)
            }
        }).catch(e => {
            console.error(`Players[getInfo]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command