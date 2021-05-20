const Util = require("../utils/util.js")
const Mojang = require("../utils/mojang.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "createmotd",
            descId: "COMMAND_CREATEMOTD",
            aliases: [
                "cmotd"
            ],
            args: [{
                name: "motd",
                descId: "COMMAND_CREATEMOTD_ARG1"
            }],
            tags: [
                "CAN_DISABLE"
            ],
            timeout: 30*1000
        })
    }

    async execute(options) {
        let motd = Mojang.generateMOTD(options.inputs[0].replace("\\n", "\n"), 4, 10)
        const specials = Mojang.getFormatChars()
        let clientMotd = options.inputs[0].replace(new RegExp(specials[1], "g"), specials[0])

        Util.sendMessage(options.message, options.lang.COMMAND_CREATEMOTD_CONTENT.format(clientMotd, clientMotd.replace(new RegExp(specials[0], "g"), "\\u00A7")), {
            files: [
                {
                    attachment: motd.toBuffer("image/png"),
                    name: "motd.png"
                }
            ]
        }).catch(e => {
            console.error(`CreateMotd[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command