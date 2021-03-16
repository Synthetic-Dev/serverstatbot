const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "mods",
            desc: "Displays the mods that are on the server",
            args: [
                {
                    name: "page",
                    desc: "The starting page to display",
                    optional: true
                }
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]

        const ip = await settings.get("ip")
        const port = await settings.get("port")

        const itemsPerPage = 16

        let startPage = inputs[0] ? Number(inputs[0]) : 1
        if (typeof(startPage) != "number" || startPage == null || isNaN(startPage)) return Util.replyError(message, "Page must be a number");

        Util.sendMessage(message.channel, ":arrows_counterclockwise: Pinging server...").then(botMessage => {
            Protocol.getInfo(ip, port).then(data => {
                try {
                    botMessage.delete()
                } catch(e) {console.error(e)}
    
                if (data.online) {
                    if (!data.modded) return Util.replyMessage(message, "The server does not have any mods")

                    let pages = []
                    let modstring = ""
                    data.mods.modList.forEach((mod, index) => {
                        modstring += `• **[${mod.modId}](https://www.curseforge.com/minecraft/mc-mods/search?search=${mod.modId})** - ${mod.version}\n`
    
                        if ((index % (itemsPerPage - 1) == 0 && index != 0) || index + 1 == data.mods.modList.length) {
                            pages.push({
                                embed: {
                                    title: "Server Mods",
                                    description: `**${data.mods.modList.length} mods**${data.mods.type ? ` using ${data.mods.type}` : ""}\n` + modstring.trim(),
                                    color: 5145560
                                }
                            })
    
                            modstring = ""
                        }
                    })
    
                    Util.sendPages(message, pages, Math.max(1, Math.min(pages.length, startPage)) - 1)
                } else {
                    let error = data.error
    
                    if (["Failed to retrieve the status of the server within time", "Failed to query server within time"].includes(error.toString()) || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                        return Util.replyMessage(message, "Server is not online")
                    } else if (error.code == "ENOTFOUND") {
                        return Util.replyError(message, "Could not find server, check that a valid ip and port is set, and is the server running a supported version?");
                    }
                    
                    Util.replyError(message, `An error occured, please contact the developer\nYou can join our support server here: discord.gg/uqVp2XzUP8`)
                    console.error(error)
                }
            }).catch(e => {})
        }).catch(e=>{})
    }
}

module.exports = Command