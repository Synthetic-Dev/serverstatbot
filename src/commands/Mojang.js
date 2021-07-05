const Discord = require("discord.js")

const Util = require("../utils/Util")
const Mojang = require("../utils/Mojang")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "mojang",
            descId: "COMMAND_MOJANG",
        })
    }

    async execute(options) {
        let statuses = await Mojang.getStatus()

        let symbols = {
            green: "<:green_circle_with_tick:818512512500105249>",
            yellow: ":warning:",
            red: "<:red_circle_with_cross:818512512764084265>",
            grey: ":grey_question:",
        }

        let statusesList = []
        Object.keys(statuses).forEach((service) => {
            let value = statuses[service]
            let symbol = symbols[value] ?? ":grey_exclamation:"
            statusesList.push(`${symbol} ${service}`)
        })

        const embed = new Discord.MessageEmbed()
            .setTitle(options.lang.COMMAND_MOJANG_TITLE)
            .setDescription(statusesList.join("\n"))
            .setColor(5145560)
            .setTimestamp()

        Util.replyMessage(options.message, embed).catch((e) => {
            Util.error(e, "Mojang", "replyMessage")
        })
    }
}

module.exports = Command
