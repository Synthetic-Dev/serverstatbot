const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "plugins",
            descId: "COMMAND_PLUGINS",
            args: [
                {
                    name: "page",
                    descId: "COMMAND_PLUGINS_ARG1",
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

        const itemsPerPage = 20

        let startPage = options.inputs[0] ? Number(options.inputs[0]) : 1
        if (typeof(startPage) != "number" || startPage == null || isNaN(startPage)) return Util.replyError(options.message, options.lang.MUST_NUMBER.format("page"));

        Util.startTyping(options.message).catch(e => {
            console.error(`Plugins[startTyping]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })

        Protocol.getInfo(serverData.Ip, serverData.Port, serverData.QueryPort).then(data => {
            Util.stopTyping(options.message)

            if (data.online) {
                if (!data.plugins || data.plugins.length == 0) return Util.replyMessage(options.message, options.lang.COMMAND_PLUGINS_NOPLUGINS).catch(e => {
                    console.error(`Plugins[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                })

                let pages = []
                let pluginstring = ""
                data.plugins.forEach((plugin, index) => {
                    pluginstring += `• **[${plugin.name}](${data.bedrock ? `https://poggit.pmmp.io/p/${plugin.name}` : `https://dev.bukkit.org/search?search=${plugin.name}`})** - ${plugin.version}\n`

                    if ((index % (itemsPerPage - 1) == 0 && index != 0) || index + 1 == data.plugins.length) {
                        pages.push({
                            embed: {
                                title: options.lang.COMMAND_PLUGINS_TITLE,
                                description: options.lang.COMMAND_PLUGINS_DESC.format(data.plugins.length, pluginstring.trim()),
                                color: 5145560,
                                timestamp: Date.now()
                            }
                        })

                        pluginstring = ""
                    }
                })

                Util.sendPages(options.message, pages, Math.clamp(startPage, 1, pages.length) - 1)
            } else {
                let error = data.error
                let errorText

                switch(Protocol.getErrorType(error)) {
                    case "offline":
                        Util.replyMessage(options.message, options.lang.SERVER_OFFLINE).catch(e => {
                            console.error(`Plugins[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                        })
                        break
                    case "notfound": errorText = pptions.lang.SERVER_COULDNOTFIND; break;
                    case "badport": errorText = pptions.lang.SERVER_WRONGPORT; break;
                    case "blocked": errorText = pptions.lang.SERVER_BLOCKED; break;
                    default:
                        errorText = pptions.lang.SERVER_ERROR
                        console.error(`Plugins[error]: ${error.toString()};\n${error.method} at ${error.path}`)
                }

                if (errorText) Util.replyError(options.message, errorText);
            }
        }).catch(e => {
            console.error(`Plugins[getInfo]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command