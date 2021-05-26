const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

const Mojang = require("../utils/mojang.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "mojang",
            descId: "COMMAND_MOJANG"
        })
    }

    async execute(options) {
        let statuses = await Mojang.getStatus()

        let symbols = {
            green: "<:green_circle_with_tick:818512512500105249>",
            yellow: ":warning:",
            red: "<:red_circle_with_cross:818512512764084265>",
            grey: ":grey_question:"
        }

        let statusesList = []
        Object.keys(statuses).forEach(service => {
            let value = statuses[service]
            let symbol = symbols[value] ?? ":grey_exclamation:"
            statusesList.push(`• ${symbol} ${service}`)
        })

        Util.replyMessage(options.message, {
            embed: {
                title: "Mojang Services",
                description: statusesList.join("\n"),
                color: 5145560,
                timestamp: Date.now()
            }
        }).catch(e => {
            console.error(`Mojang[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command