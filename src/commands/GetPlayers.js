const {createCanvas, loadImage} = require("canvas")
const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

const maxInList = 25

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

        Util.request(`https://api.mcsrvstat.us/2/${await settings.getSetting("ip")}:${await settings.getSetting("port")}.tld`, (success, data) => {
            if (!success) {
                Util.replyError(message, `An error occured, please contact the developer\n\nYou can join our support server here: https://discord.gg/uqVp2XzUP8`)
            } else {
                success = false
                try {
                    data = JSON.parse(data)
                    success = true
                } catch(e) {
                    console.error(e)
                }
                
                if (!success) return Util.replyError(message, "An error occured when trying to gather server info")
                if (!data.ip || !data.port) return Util.replyError(message, "An invalid ip or port is set");
                if (!data.online) return Util.replyMessage(message, "Server is not online");

                if (data.players.online > 0) {
                    if (!data.players.list) {
                        return Util.sendMessage(message, `There is ${data.players.online}/${data.players.max} players in the server.\nThis server has too many players to display a playerlist.`)
                    }
    
                    let image = createCanvas(16 * 20 + 26, Math.min(maxInList + 1, data.players.online) * 28)
                    let context = image.getContext("2d")
    
                    context.font = "20px 'Pixel Font'"
                    context.textBaseline = "top"
                    context.textAlign = "left"
                    context.fillStyle = "#fff"
    
                    let promises = []
                    data.players.list.forEach((player, i) => {
                        if (i >= maxInList + 1) {
                            if (i == maxInList + 1) {
                                context.fillText(`and ${data.players.online - maxInList} more...`, 2, i * 28 - 2)
                            }
                            return
                        }
    
                        promises.push(loadImage(`https://mc-heads.net/avatar/${player}/22.png`))
                        context.fillText(player, 32, i * 28 - 2)
                    })
    
                    Promise.all(promises).then(heads => {
                        heads.forEach((head, i) => {
                            context.drawImage(head, 2, 2 + i * 28)
                        })
    
                        Util.sendMessage(message, "Players:", {
                            files: [{
                                attachment: image.toBuffer("image/png"),
                                name: "playerlist.png"
                            }]
                        })
                    })
                } else {
                    Util.sendMessage(message, "Nobody is currently online :cry:")
                }
            }
        })
    }
}

module.exports = Command