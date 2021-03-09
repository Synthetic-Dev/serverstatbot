const {createCanvas, loadImage} = require("canvas")
const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "getplayers",
            desc: "Gets all the players currently online",
            aliases: [
                "players",
                "plrs"
            ]
        })
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]

        const ip = await settings.getSetting("ip")
        const port = await settings.getSetting("port")

        let promise = Util.sendMessage(message.channel, ":arrows_counterclockwise: Pinging server...")
        if (!promise) return;
        let botMessage = await promise

        Protocol.getInfo(ip, port).then(async data => {
            try {
                botMessage.delete()
            } catch(e) {console.error(e)}

            if (data.online) {
                if (data.players.online == 0) return Util.sendMessage(message, "Nobody is currently online");
                if (!data.players.sample || data.players.sample.length == 0) return Util.sendMessage(message, `There is ${data.players.online}/${data.players.max} players in the server.\nThis server has too many players to display a playerlist.`);

                const columns = 4
                const maxInList = 80
                const breakpoint = Math.ceil(maxInList / columns)
                const amountInList = Math.min(maxInList, data.players.sample.length)
                const height = Math.min(breakpoint, data.players.sample.length)

                const maxWidth = 256
                const columnCount = Math.ceil(data.players.sample.length / breakpoint)

                let image = createCanvas((32 + maxWidth) * columnCount + (5 * (columnCount - 1)), height * 28)
                let context = image.getContext("2d")

                context.imageSmoothingEnabled = false
                context.font = "20px 'Pixel Font'"
                context.textBaseline = "top"
                context.textAlign = "left"
                context.fillStyle = "#fff"

                await new Promise((resolve, reject) => {
                    let done = 0
                    data.players.sample.forEach((player, i) => {
                        const column = Math.floor(i / breakpoint)

                        if (i >= maxInList) {
                            if (i == maxInList) {
                                context.fillText(`and ${data.players.online - maxInList} more...`, 2 + (maxWidth * column) + (5 * column), (i - breakpoint * column) * 28 - 2, maxWidth - 2)
                            }

                            if (done >= amountInList) resolve();
                        } else {
                            loadImage(`https://mc-heads.net/avatar/${player.name.clean}/22`).then(head => {
                                context.drawImage(head, 2 + (maxWidth * column) + (5 * column), 2 + (i - breakpoint * column) * 28, 22, 22)
                            }).catch(e => {}).finally(() => {
                                context.fillText(player.name.clean, 32 + (maxWidth * column) + (5 * column), (i - breakpoint * column) * 28 - 2, maxWidth - 32)
                                done++
                                if (done >= amountInList) resolve();
                            })
                        }
                    })
                })

                Util.sendMessage(message, {
                    files: [{
                        attachment: image.toBuffer("image/png"),
                        name: "playerlist.png"
                    }],
                    embed: {
                        title: "Playerlist",
                        description: `**${data.players.online}/${data.players.max} players**` + (!data.query ? "\nThis may not be all the players set ``enable-query=true`` to get all players." : ""),
                        color: 5145560,
                        image: {
                            url: "attachment://playerlist.png"
                        }
                    }
                })
            } else {
                let error = data.error

                if (error == "Unknown error" || error == "Failed to retrieve the status of the server within time" || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                    return Util.replyMessage(message, "Server is not online")
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