const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "plugins",
            desc: "Displays the plugins that are on the server"
        })
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]

        const ip = await settings.getSetting("ip")
        const port = await settings.getSetting("port")

        let promise = Util.sendMessage(message.channel, ":arrows_counterclockwise: Pinging server...")
        if (!promise) return;
        let botMessage = await promise

        Protocol.getInfo(ip, port).then(data => {
            try {
                botMessage.delete()
            } catch(e) {console.error(e)}

            if (data.online) {
                if (!data.plugins || data.plugins.length == 0) return Util.replyMessage(message, "The server does not have any plugins")

                let pages = []
                let pluginstring = ""
                data.plugins.forEach((plugin, index) => {
                    pluginstring += `• **[${plugin.name}](https://dev.bukkit.org/search?search=${plugin.name})** - ${plugin.version}\n`

                    if ((index % 19 == 0 && index != 0) || index + 1 == data.plugins.length) {
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

                Util.sendPages(message, pages)
            } else {
                let error = data.error

                if (error == "Unknown error" || error == "Failed to retrieve the status of the server within time" || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                    return Util.replyMessage(message, "Server is not online")
                } else if (error.code == "ENOTFOUND") {
                    return Util.replyError(message, "Could not find server, check that a valid ip and port is set, and is the server running a supported version?");
                }
                
                Util.replyError(message, `An error occured, please contact the developer\nYou can join our support server here: discord.gg/uqVp2XzUP8`)
                console.error(error)
            }
        })
    }
}

module.exports = Command