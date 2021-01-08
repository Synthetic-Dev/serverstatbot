const {createCanvas, loadImage} = require("canvas")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "imagetest",
            desc: "Test command",
            args: [{
                name: "value"
            }],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(inputs, message) {
        const settings = this.client.settings[message.guild.id]

        let player = inputs[0]

        let image = createCanvas((16 + 21) * 13 + 26, 28)
        let context = image.getContext("2d")

        context.font = "17px 'Pixel Font'"
        context.textBaseline = "top"
        context.textAlign = "left"
        context.fillStyle = "#fff"

        let head = await loadImage(`https://mc-heads.net/avatar/${player}/22.png`)
        context.drawImage(head, 2, 2)
        context.fillText(`${player} has joined the game.`, 32, 2)

        message.channel.send({
            files: [{
                attachment: image.toBuffer("image/png"),
                name: "playeraction.png"
            }]
        })
    }
}

module.exports = Command