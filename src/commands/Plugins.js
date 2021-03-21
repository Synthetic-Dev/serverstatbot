const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "plugins",
            desc: "Displays the plugins that are on the server",
            args: [
                {
                    name: "page",
                    desc: "The starting page to display",
                    optional: true
                }
            ],
            tags: [
                "CAN_DISABLE"
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]

        const ip = await settings.get("ip")
        const port = await settings.get("port")

        const itemsPerPage = 20

        let startPage = inputs[0] ? Number(inputs[0]) : 1
        if (typeof(startPage) != "number" || startPage == null || isNaN(startPage)) return Util.replyError(message, "Page must be a number");

        Util.sendMessage(message.channel, ":arrows_counterclockwise: Pinging server...").then(botMessage => {
            Protocol.getInfo(ip, port).then(data => {
                botMessage.delete().catch(console.error)
    
                if (data.online) {
                    if (!data.plugins || data.plugins.length == 0) return Util.replyMessage(message, "The server does not have any plugins").catch(console.error)
    
                    let pages = []
                    let pluginstring = ""
                    data.plugins.forEach((plugin, index) => {
                        pluginstring += `• **[${plugin.name}](${data.bedrock ? `https://poggit.pmmp.io/p/${plugin.name}` : `https://dev.bukkit.org/search?search=${plugin.name}`})** - ${plugin.version}\n`
    
                        if ((index % (itemsPerPage - 1) == 0 && index != 0) || index + 1 == data.plugins.length) {
                            pages.push({
                                embed: {
                                    title: "Server Plugins",
                                    description: `**${data.plugins.length} plugins**\n` + pluginstring.trim(),
                                    color: 5145560
                                }
                            })
    
                            pluginstring = ""
                        }
                    })
    
                    Util.sendPages(message, pages, Math.max(1, Math.min(pages.length, startPage)) - 1)
                } else {
                    let error = data.error
    
                    if (["Failed to retrieve the status of the server within time", "Failed to query server within time"].includes(error.message) || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                        return Util.replyMessage(message, "Server is not online").catch(console.error)
                    } else if (error.code == "ENOTFOUND") {
                        return Util.replyError(message, "Could not find server, check that a valid ip and port is set, and is the server running a supported version?");
                    }
                    
                    Util.replyError(message, `An error occured, please contact the developer\nYou can join our support server here: discord.gg/uqVp2XzUP8`)
                    console.error(error)
                }
            }).catch(console.error)
        }).catch(console.error)
    }
}

module.exports = Command