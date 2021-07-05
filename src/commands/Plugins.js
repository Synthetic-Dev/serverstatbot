const Discord = require("discord.js")

const Util = require("../utils/Util")
const Protocol = require("../utils/Protocol")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "plugins",
            descId: "COMMAND_PLUGINS",
            args: [
                {
                    name: "page",
                    descId: "COMMAND_PLUGINS_ARG1",
                    optional: true,
                },
            ],
            tags: ["CAN_DISABLE"],
        })
    }

    async execute(options) {
        const serverData = await options.settings.get("server")

        const itemsPerPage = 20

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
            Util.error(e, "Plugins", "startTyping")
        })

        Protocol.getInfo(serverData.Ip, serverData.Port, serverData.QueryPort)
            .then((data) => {
                Util.stopTyping(options.message)

                if (data.online) {
                    if (!data.plugins || data.plugins.length == 0)
                        return Util.replyMessage(
                            options.message,
                            options.lang.COMMAND_PLUGINS_NOPLUGINS
                        ).catch((e) => {
                            Util.error(e, "Plugins", "replyMessage1")
                        })

                    let pages = []
                    let pluginstring = ""
                    data.plugins.forEach((plugin, index) => {
                        pluginstring += `• **[${plugin.name}](${
                            data.bedrock
                                ? `https://poggit.pmmp.io/p/${plugin.name}`
                                : `https://dev.bukkit.org/search?search=${plugin.name}`
                        })** - ${plugin.version}\n`

                        if (
                            (index % (itemsPerPage - 1) == 0 && index != 0) ||
                            index + 1 == data.plugins.length
                        ) {
                            const embed = new Discord.MessageEmbed()
                                .setTitle(options.lang.COMMAND_PLUGINS_TITLE)
                                .setDescription(
                                    options.lang.COMMAND_PLUGINS_DESC.format(
                                        data.plugins.length,
                                        pluginstring.trim()
                                    )
                                )
                                .setColor(5145560)
                                .setTimestamp()

                            pages.push({ embed: embed })
                            pluginstring = ""
                        }
                    })

                    Util.sendPages(
                        options.message,
                        pages,
                        Math.clamp(startPage, 1, pages.length) - 1
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
                                Util.error(e, "Plugins", "replyMessage2")
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
                                `Plugins[error]: ${error.toString()};\n${
                                    error.method
                                } at ${error.path}`
                            )
                    }

                    if (errorText) Util.replyError(options.message, errorText)
                }
            })
            .catch((e) => {
                Util.error(e, "Plugins", "getInfo")
            })
    }
}

module.exports = Command
