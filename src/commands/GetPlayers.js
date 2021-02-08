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

        Protocol.ping(ip, port).then(data => {
            try {
                botMessage.delete()
            } catch(e) {console.error(e)}

            if (data.players.online == 0) return Util.sendMessage(message, "Nobody is currently online");
            if (!data.players.sample || data.players.sample.length == 0) return Util.sendMessage(message, `There is ${data.players.online}/${data.players.max} players in the server.\nThis server has too many players to display a playerlist.`);

            const maxInList = 30

            let image = createCanvas(16 * 20 + 26, Math.min(maxInList + 1, data.players.online) * 28)
            let context = image.getContext("2d")

            context.font = "20px 'Pixel Font'"
            context.textBaseline = "top"
            context.textAlign = "left"
            context.fillStyle = "#fff"

            let promises = []
            data.players.sample.forEach((player, i) => {
                if (i >= maxInList) {
                    if (i == maxInList) {
                        context.fillText(`and ${data.players.online - maxInList} more...`, 2, i * 28 - 2)
                    }
                    return
                } else {
                    promises.push(loadImage(`https://mc-heads.net/avatar/${player.name}/22.png`))
                    context.fillText(player.name, 32, i * 28 - 2)
                }
            })

            Promise.all(promises).then(heads => {
                heads.forEach((head, i) => {
                    context.drawImage(head, 2, 2 + i * 28)
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
            })
        }).catch(error => {
            try {
                botMessage.delete()
            } catch(e) {console.error(e)}

            if (error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH") {
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