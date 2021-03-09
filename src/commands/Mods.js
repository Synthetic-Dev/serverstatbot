const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "mods",
            desc: "Displays the mods that are on the server"
        })
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]

        const ip = await settings.getSetting("ip")
        const port = await settings.getSetting("port")

        const itemsPerPage = 16

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
    
                    Util.sendPages(message, pages)
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
            })
        }).catch(e=>{})
    }
}

module.exports = Command