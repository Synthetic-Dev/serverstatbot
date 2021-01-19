const Util = require("../utils/util.js")
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

        Util.request(`https://api.mcsrvstat.us/2/${ip}:${port}.tld`, (success, data) => {
            if (!success) {
                Util.replyError(message, `An error occured, please contact the developer\n\nYou can join our support server here: https://discord.gg/uqVp2XzUP8`)
            } else {
                success = false
                try {
                    data = JSON.parse(data)
                    success = true
                } catch(e) {
                    console.error(e)
                }
                
                if (!success) return Util.replyError(message, "An error occured when trying to gather server info")
                if (!data.ip || !data.port) return Util.replyError(message, "An invalid ip or port is set");
                if (!data.online) return Util.replyMessage(message, "Server is not online");

                let pages = []
                let fields = []
                let rawMods = Object.values(data.mods.raw)
                rawMods.forEach((mod, index) => {
                    let name = data.mods.names[index]
                    let version = mod.substring(name.length + 1)
                    fields.push({
                        name: name,
                        value: version == "" ? "Unknown version" : version,
                        inline: true
                    })

                    if ((index % 20 == 0 && index != 0) || index - 1 == rawMods.length) {
                        pages.push({
                            embed: {
                                title: "Server Mods",
                                description: `Number of Mods: ${data.mods.names.length}`,
                                color: 5145560,
                                fields: fields
                            }
                        })

                        fields = []
                    }
                })

                pages.forEach((page, index) => {
                    page.embed["footer"] = {
                        text: `Page ${index + 1}/${pages.length}`,
                        icon_url: message.author.avatarURL({
                            size: 32,
                            dynamic: true,
                            format: "png"
                        })
                    }
                })

                Util.sendPages(message, pages)
            }
        })
    }
}

module.exports = Command