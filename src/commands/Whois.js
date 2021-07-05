const { createCanvas, loadImage } = require("canvas")
const Discord = require("discord.js")
const { getAverageColor } = require("fast-average-color-node")

const Util = require("../utils/Util")
const Mojang = require("../utils/Mojang")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "whois",
            descId: "COMMAND_WHOIS",
            aliases: ["user"],
            args: [
                {
                    name: "username",
                    descId: "COMMAND_WHOIS_ARG1",
                },
            ],
            tags: ["CAN_DISABLE"],
        })
    }

    async execute(options) {
        let identifier = options.inputs[0]

        Util.startTyping(options.message).catch((e) => {
            Util.error(e, "Whois", "startTyping")
        })

        let uuid = identifier.replace("-", "")
        if (!Mojang.isUUID(uuid)) uuid = await Mojang.getUUID(identifier)

        let nameHistory
        if (uuid) {
            nameHistory = await Mojang.getNameHistory(uuid)
        }

        if (!nameHistory) {
            Util.stopTyping(options.message)

            const embed = new Discord.MessageEmbed()
                .setTitle(options.lang.COMMAND_WHOIS_AVAILABLE_TITLE)
                .setDescription(
                    options.lang.COMMAND_WHOIS_AVAILABLE_DESC.format(identifier)
                )
                .setColor(4633441)
                .setTimestamp()

            return Util.sendMessage(options.message, { embed: embed }).catch(
                (e) => {
                    Util.error(e, "Whois", "sendMessage1")
                }
            )
        }

        let nameHistoryString = ""
        nameHistory.changes.forEach((change) => {
            nameHistoryString += `• ${
                change.changedToAt
                    ? new Date(change.changedToAt).toLocaleDateString(
                          options.locale
                      )
                    : options.lang.ORIGINAL
            } : **${change.name}**\n`
        })

        let image = createCanvas(180 + 20 + 180, 432)
        let context = image.getContext("2d")

        let images = []
        images.push(await loadImage(`https://mc-heads.net/body/${uuid}`))
        images.push(await loadImage(`https://mc-heads.net/player/${uuid}`))
        images.push(await loadImage(`https://mc-heads.net/skin/${uuid}`))

        context.imageSmoothingEnabled = false
        context.fillStyle = "#fff"

        context.drawImage(images[0], 0, 0, 180, 432)
        context.drawImage(images[1], 180 + 20, 0, 180, 360)
        let scale = 64 / images[2].height
        context.drawImage(
            images[2],
            180 + 20,
            360 + 8,
            Math.floor(images[2].width * scale),
            Math.floor(images[2].height * scale)
        )

        let averageColor = await getAverageColor(
            `https://mc-heads.net/body/${uuid}`
        )
        let decimalColor =
            averageColor.value[0] * 256 * 256 +
            averageColor.value[1] * 256 +
            averageColor.value[2]

        Util.stopTyping(options.message)

        const embed = new Discord.MessageEmbed()
            .setDescription(`UUID: \`${uuid}\``)
            .setColor(decimalColor)
            .setAuthor(
                nameHistory.current,
                `https://mc-heads.net/avatar/${uuid}/100`
            )
            .addFields([
                {
                    name: options.lang.COMMAND_WHOIS_FIELD1,
                    value: nameHistoryString.trim(),
                    inline: true,
                },
                {
                    name: options.lang.COMMAND_WHOIS_FIELD2,
                    value: options.lang.COMMAND_WHOIS_FIELD2_VAL.format(uuid),
                    inline: true,
                },
            ])
            .setImage("attachment://skin.png")
            .setFooter(Util.getFooter(options.message, false).text)
            .setTimestamp()
            .attachFiles([
                {
                    attachment: image.toBuffer("image/png"),
                    name: "skin.png",
                },
            ])

        Util.sendMessage(options.message, embed).catch((e) => {
            Util.error(e, "Whois", "sendMessage2")
        })
    }
}

module.exports = Command
