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

                context.font = "20px 'Pixel Font'"
                context.textBaseline = "top"
                context.textAlign = "left"
                context.fillStyle = "#fff"

                let loaded = 0
                data.players.list.forEach(async (player, i) => {
                    context.fillText(player, 32, i * 28 - 2)
                    context.drawImage(await loadImage(`https://minotar.net/helm/${player}/22.png`), 2, 2 + i * 28)

                    loaded++

                    if (i + 1 >= data.players.online) {
                        console.log("Waiting for images")
                        while (loaded < data.players.online){}

                        message.channel.send("Players:", {
                            files: [{
                                attachment: image.toBuffer("image/png"),
                                name: "playerlist.png"
                            }]
                        })
                    }
                })
            } else {
                message.channel.send("Nobody is currently online :cry:")
            }
        })
    }
}

module.exports = Command