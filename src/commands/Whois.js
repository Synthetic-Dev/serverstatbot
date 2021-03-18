const {createCanvas, loadImage} = require("canvas")
const { getAverageColor } = require("fast-average-color-node")
const Util = require("../utils/util.js")
const Mojang = require("../utils/mojang.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "whois",
            desc: "Get information about a player",
            aliases: [
                "user"
            ],
            args: [{
                name: "username | uuid",
                desc: "The username or uuid of the player you want to get information about"
            }],
            tags: [
                "CAN_DISABLE"
            ]
        })
    }

    async execute(message, inputs) {
        let identifier = inputs[0]

        Util.sendMessage(message.channel, ":arrows_counterclockwise: Fetching info...").then(async botMessage => {
            let uuid = identifier.replace("-", "")
            if (!Mojang.isUUID(uuid)) uuid = await Mojang.getUUID(identifier);

            let nameHistory
            if (uuid) {
                nameHistory = await Mojang.getNameHistory(uuid)
            }

            if (!nameHistory) {
                botMessage.delete().catch(e => {})

                return Util.sendMessage(message, {
                    embed: {
                        title: ":white_check_mark: Available account",
                        description: `No account with the identifier \`\`${identifier}\`\` exists.`
                    }
                })
            }

            let nameHistoryString = ""
            nameHistory.changes.forEach(change => {
                nameHistoryString += `• ${change.changedToAt ? (new Date(change.changedToAt)).toDateString() : "Original"} : **${change.name}**\n`
            })

            let image = createCanvas(180 + 20 + 180, 432)
            let context = image.getContext("2d")

            let images = []
            images.push(await loadImage(`https://mc-heads.net/body/${uuid}`))
            images.push(await loadImage(`https://mc-heads.net/player/${uuid}`))
            images.push(await loadImage(`https://mc-heads.net/skin/${uuid}`))

            context.imageSmoothingEnabled = false
            context.fillStyle = "#fff"

            context.drawImage(images[0], 0, 0, 180, 432);
            context.drawImage(images[1], 180 + 20, 0, 180, 360);
            let scale = 64 / images[2].height
            context.drawImage(images[2], 180 + 20, 360 + 8, Math.floor(images[2].width * scale), Math.floor(images[2].height * scale));

            let averageColor = await getAverageColor(`https://mc-heads.net/body/${uuid}`)
            let decimalColor = (averageColor.value[0] * 256*256) + (averageColor.value[1] * 256) + (averageColor.value[2])

            botMessage.delete().catch(e => {})

            Util.sendMessage(message, {
                files: [{
                    attachment: image.toBuffer("image/png"),
                    name: "skin.png"
                }],
                embed: {
                    author: {
                        name: nameHistory.current,
                        icon_url: `https://mc-heads.net/avatar/${uuid}/100`
                    },
                    description: `UUID: \`\`${uuid}\`\``,
                    color: decimalColor,
                    fields: [
                        {
                            name: "Usernames",
                            value: nameHistoryString.trim(),
                            inline: true
                        },
                        {
                            name: "Skin",
                            value: `[Download skin](https://mc-heads.net/download/${uuid})\n[Apply skin](https://mc-heads.net/change/${uuid})\nProvided by [mc-heads.net](https://mc-heads.net/)`,
                            inline: true
                        }
                    ],
                    image: {
                        url: "attachment://skin.png"
                    }
                }
            })
        }).catch(e=>{})
    }
}

module.exports = Command