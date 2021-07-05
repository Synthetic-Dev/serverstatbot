const Discord = require("discord.js")

const Util = require("../utils/Util")
const Protocol = require("../utils/Protocol")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "mods",
            descId: "COMMAND_MODS",
            args: [
                {
                    name: "page",
                    descId: "COMMAND_MODS_ARG1",
                    optional: true,
                },
            ],
            tags: ["CAN_DISABLE"],
        })
    }

    async execute(options) {
        const serverData = await options.settings.get("server")

        const itemsPerPage = 16

        let startPage = options.inputs[0] ? Number(options.inputs[0]) : 1
        if (
            typeof startPage != "number" ||
            startPage == null ||
            isNaN(startPage)
        )
            return Util.replyError(
                options.message,
                options.lang.MUST_NUMBER.format("page")
            )

        Util.startTyping(options.message).catch((e) => {
            Util.error(e, "Mods", "startTyping")
        })

        Protocol.getInfo(serverData.Ip, serverData.Port, serverData.QueryPort)
            .then((data) => {
                Util.stopTyping(options.message)

                if (data.online) {
                    if (!data.modded)
                        return Util.replyMessage(
                            options.message,
                            options.lang.COMMAND_MODS_NOMODS
                        ).catch((e) => {
                            Util.error(e, "Mods", "replyMessage1")
                        })

                    let pages = []
                    let modstring = ""
                    data.mods.modList.forEach((mod, index) => {
                        modstring += `• **[${mod.modId}](https://www.curseforge.com/minecraft/mc-mods/search?search=${mod.modId})** - ${mod.version}\n`

                        if (
                            (index % (itemsPerPage - 1) == 0 && index != 0) ||
                            index + 1 == data.mods.modList.length
                        ) {
                            const embed = new Discord.MessageEmbed()
                                .setTitle(options.lang.COMMAND_MODS_TITLE)
                                .setDescription(
                                    options.lang.COMMAND_MODS_DESC.format(
                                        data.mods.modList.length,
                                        data.mods.type ?? "N/A",
                                        modstring.trim()
                                    )
                                )
                                .setColor(5145560)
                                .setTimestamp()

                            pages.push({ embed: embed })
                            modstring = ""
                        }
                    })

                    Util.sendPages(
                        options.message,
                        pages,
                        Math.max(1, Math.min(pages.length, startPage)) - 1
                    )
                } else {
                    let error = data.error
                    let errorText

                    switch (Protocol.getErrorType(error)) {
                        case "offline":
                            Util.replyMessage(
                                options.message,
                                options.lang.SERVER_OFFLINE
                            ).catch((e) => {
                                Util.error(e, "Mods", "replyMessage2")
                            })
                            break
                        case "notfound":
                            errorText = options.lang.SERVER_COULDNOTFIND
                            break
                        case "badport":
                            errorText = options.lang.SERVER_WRONGPORT
                            break
                        case "blocked":
                            errorText = options.lang.SERVER_BLOCKED
                            break
                        default:
                            errorText = options.lang.SERVER_ERROR
                            console.error(
                                `Mods[error]: ${error.toString()};\n${
                                    error.method
                                } at ${error.path}`
                            )
                    }

                    if (errorText) Util.replyError(options.message, errorText)
                }
            })
            .catch((e) => {
                Util.error(e, "Mods", "getInfo")
            })
    }
}

module.exports = Command
