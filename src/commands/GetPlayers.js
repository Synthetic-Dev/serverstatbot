const discord = require("discord.js")
const {createCanvas, loadImage, Image} = require("canvas")
const fs = require("fs")

const util = require("../util.js")
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

                let buffer = image.toBuffer("image/png")
                let i = 0

                data.players.list.forEach(player => {
                    let ci = i

                    context.font = "20px 'PixelFont'"
                    context.textBaseline = "top"
                    context.textAlign = "left"
                    context.fillStyle = "#fff"
                    context.fillText(player, 32, ci * 28 - 2)

                    let head = new Image()
                    head.onload = function() {
                        context.drawImage(head, 2, 2 + ci * 28)
                        buffer = image.toBuffer("image/png")
                    }
                    head.src = `https://minotar.net/helm/${player}/22.png`

                    i++
                })

                setTimeout(function() {}, util.ping(message) * data.players.online)

                message.channel.send("Players:", {
                    files: [{
                        attachment: buffer,
                        name: "playerlist.png"
                    }]
                })
            } else {
                message.channel.send("Nobody is currently online :cry:")
            }
        })
    }
}

module.exports = Command