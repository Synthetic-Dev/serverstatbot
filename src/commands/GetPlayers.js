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

        Protocol.ping(ip, port).then(async data => {
            try {
                botMessage.delete()
            } catch(e) {console.error(e)}

            if (data.players.online == 0) return Util.sendMessage(message, "Nobody is currently online");
            if (!data.players) return Util.replyWarning("Unable to get players in server, please try again.")
            if (!data.players.sample || data.players.sample.length == 0) return Util.sendMessage(message, `There is ${data.players.online}/${data.players.max} players in the server.\nThis server has too many players to display a playerlist.`);

            const maxInList = 30
            const length = Math.min(maxInList + 1, data.players.sample.length)

            let image = createCanvas(1000, length * 28)
            let context = image.getContext("2d")

            context.font = "20px 'Pixel Font'"
            context.textBaseline = "top"
            context.textAlign = "left"

            let longest = length > maxInList ? context.measureText(`and ${data.players.online - maxInList} more...`) : 0
            data.players.sample.forEach(player => {
                let size = context.measureText(player.name)
                if (size.width > longest) longest = size.width;
            })

            image = createCanvas(32 + longest, length * 28)
            context = image.getContext("2d")

            context.imageSmoothingEnabled = false
            context.font = "20px 'Pixel Font'"
            context.textBaseline = "top"
            context.textAlign = "left"
            context.fillStyle = "#fff"

            await new Promise((resolve, reject) => {
                let done = 0
                data.players.sample.forEach((player, i) => {
                    if (i >= maxInList) {
                        if (i == maxInList) {
                            context.fillText(`and ${data.players.online - maxInList} more...`, 2, i * 28 - 2)
                        }

                        if (done >= length) resolve();
                    } else {
                        loadImage(`https://mc-heads.net/avatar/${player.id}/22`).then(head => {
                            context.drawImage(head, 2, 2 + i * 28, 22, 22)
                        }).catch(e => {}).finally(() => {
                            context.fillText(player.name, 32, i * 28 - 2)
                            done++
                            if (done >= length) resolve();
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
                    description: `There is ${data.players.online}/${data.players.max} players in the server.`,
                    color: 5145560,
                    image: {
                        url: "attachment://playerlist.png"
                    }
                }
            })
        }).catch(error => {
            try {
                botMessage.delete()
            } catch(e) {console.error(e)}

            if (error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNRESET") {
                return Util.replyMessage(message, "Server is not online")
            } else if (error.code == "ECONNREFUSED") {
                return Util.replyWarning(message, "Server refused connection, is the server online and is ``enable-query=true``?")
            } else if (error.code == "ENOTFOUND") {
                return Util.replyError(message, "Could not find server, check that a valid ip and port is set, and is the server running a supported version?");
            }

            Util.replyError(message, `An error occured, please contact the developer\n\nYou can join our support server here: https://discord.gg/uqVp2XzUP8`)
            console.error(error)
        })
    }
}

module.exports = Command