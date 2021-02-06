const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "mods",
            desc: "Displays the current mods that are on the server"
        })
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]

        const ip = await settings.getSetting("ip")
        const port = await settings.getSetting("port")

        let promise = Util.sendMessage(message.channel, ":arrows_counterclockwise: Pinging server...")
        if (!promise) return;
        let botMessage = await promise

        Protocol.ping(ip, port).then(data => {
            try {
                botMessage.delete()
            } catch(e) {console.error(e)}

            if (!data.forgeData) return Util.replyMessage(message, "The linked server is not a modded server or does not use forge")

            let pages = []
            let modstring = ""
            data.forgeData.mods.forEach((mod, index) => {
                modstring += `• **${mod.modId}** - ${mod.version}\n`

                if ((index % 19 == 0 && index != 0) || index + 1 == data.forgeData.mods.length) {
                    pages.push({
                        embed: {
                            title: "Server Mods",
                            description: `Number of Mods: ${data.forgeData.mods.length}\n\n` + modstring.trim(),
                            color: 5145560
                        }
                    })

                    modstring = ""
                }
            })

            pages.forEach((page, index) => {
                page.embed.footer = {
                    text: `Page ${index + 1}/${pages.length}`,
                    icon_url: message.author.avatarURL({
                        size: 32,
                        dynamic: true,
                        format: "png"
                    })
                }
            })

            Util.sendPages(message, pages)
        }).catch(error => {
            try {
                botMessage.delete()
            } catch(e) {console.error(e)}

            if (error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH") {
                return Util.replyMessage(message, "Server is not online")
            } else if (error.code == "ENOTFOUND") {
                return Util.replyError(message, "An invalid ip or port is set");
            }

            Util.replyError(message, `An error occured, please contact the developer\n\nYou can join our support server here: https://discord.gg/uqVp2XzUP8`)
            console.error(error)
        })
    }
}

module.exports = Command