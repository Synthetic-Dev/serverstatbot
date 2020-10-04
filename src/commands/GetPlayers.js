const discord = require("discord.js")
const {createCanvas, loadImage, Image} = require("canvas")
const fs = require("fs")

const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "getplayers",
            desc: "Gets all the players currently online",
            aliases: [
                "players"
            ]
        })
    }

    async execute(inputs, message) {
        const info = this.client.commands.get("info")

        info.getServerInfo(message, data => {
            if (data.players.online > 0) {
                let image = createCanvas(16 * 20 + 26, data.players.online * 28)
                let context = image.getContext("2d")

                context.font = "20px 'Pixel Font'"
                context.textBaseline = "top"
                context.textAlign = "left"
                context.fillStyle = "#fff"

                let promises = []
                data.players.list.forEach((player, i) => {
                    promises.push(loadImage(`https://minotar.net/helm/${player}/22.png`))
                    context.fillText(player, 32, i * 28 - 2)
                })

                Promise.all(promises).then(heads => {
                    heads.forEach((head, i) => {
                        context.drawImage(head, 2, 2 + i * 28)
                    })

                    message.channel.send("Players:", {
                        files: [{
                            attachment: image.toBuffer("image/png"),
                            name: "playerlist.png"
                        }]
                    })
                })
            } else {
                message.channel.send("Nobody is currently online :cry:")
            }
        })
    }
}

module.exports = Command