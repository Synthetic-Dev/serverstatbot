const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "mods",
            descId: "COMMAND_MODS",
            args: [
                {
                    name: "page",
                    descId: "COMMAND_MODS_ARG1",
                    optional: true
                }
            ],
            tags: [
                "CAN_DISABLE"
            ]
        })
    }

    async execute(options) {
        const serverData = await options.settings.get("server")

        const itemsPerPage = 16

        let startPage = options.inputs[0] ? Number(options.inputs[0]) : 1
        if (typeof(startPage) != "number" || startPage == null || isNaN(startPage)) return Util.replyError(options.message, options.lang.MUST_NUMBER.format("page"));

        Util.startTyping(options.message).catch(e => {
            console.error(`Mods[startTyping]: ${e.toString()};\n${e.method} at ${e.path}`)
        })

        Protocol.getInfo(serverData.Ip, serverData.Port, serverData.QueryPort).then(data => {
            Util.stopTyping(options.message)

            if (data.online) {
                if (!data.modded) return Util.replyMessage(options.message, options.lang.COMMAND_MODS_NOMODS).catch(e => {
                    console.error(`Mods[replyMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                })

                let pages = []
                let modstring = ""
                data.mods.modList.forEach((mod, index) => {
                    modstring += `• **[${mod.modId}](https://www.curseforge.com/minecraft/mc-mods/search?search=${mod.modId})** - ${mod.version}\n`

                    if ((index % (itemsPerPage - 1) == 0 && index != 0) || index + 1 == data.mods.modList.length) {
                        pages.push({
                            embed: {
                                title: options.lang.COMMAND_MODS_TITLE,
                                description: options.lang.COMMAND_MODS_DESC.format(data.mods.modList.length, data.mods.type ?? "N/A", modstring.trim()),
                                color: 5145560,
                                timestamp: Date.now()
                            }
                        })

                        modstring = ""
                    }
                })

                Util.sendPages(options.message, pages, Math.max(1, Math.min(pages.length, startPage)) - 1)
            } else {
                let error = data.error

                if (["Failed to retrieve the status of the server within time", "Failed to query server within time"].includes(error.message) || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                    return Util.replyMessage(options.message, options.lang.SERVER_OFFLINE).catch(e => {
                        console.error(`Mods[replyMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })
                } else if (error.code == "ENOTFOUND") {
                    return Util.replyError(options.message, options.lang.SERVER_COULDNOTFIND);
                } else if (error.message == "Server sent an invalid packet type") {
                    return Util.replyError(options.message, options.lang.SERVER_WRONGPORT)
                } else if (error.message == "Blocked host") {
                    return Util.replyError(options.message, options.lang.SERVER_BLOCKED);
                }
                
                Util.replyError(options.message, options.lang.SERVER_ERROR)
                console.error(`Mods[error]: ${error.toString()};\n${error.method} at ${error.path}`)
            }
        }).catch(e => {
            console.error(`Mods[getInfo]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command