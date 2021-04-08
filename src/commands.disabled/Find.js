const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "find",
            desc: "Checks if a player is in the connected server",
            aliases: [
                "getplayer"
            ],
            args: [
                {
                    name: "username | uuid",
                    desc: "The username or uuid of the player you want to find"
                }
            ]
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]

        const ip = await settings.get("ip")
        const port = await settings.get("port")

        Util.startTyping(message).catch(console.error)

        Protocol.getInfo(ip, port).then(async data => {
            Util.stopTyping(message)

            if (data.online) {
                if (data.players.online == 0) return Util.sendMessage(message, "Nobody is currently online").catch(console.error);
                if (!data.players.sample || data.players.sample.length == 0) {
                    return Util.sendWarning(message, "There is too many players online or the server does not have ``enable-query=true``.")
                }

                let finds = []
                data.players.sample.forEach(player => {
                    if (find) return;
                    if ([player.name.clean.toLowerCase().substr(0, inputs[0].length), player.name.raw.toLowerCase().substr(0, inputs[0].length), player.id ? player.id.toLowerCase().substr(0, inputs[0].length) : ""].includes(inputs[0].toLowerCase())) {
                        find = player
                    }
                })

                if (find) Util.sendMessage(message, `${find.name.clean} is in the server.`).catch(console.error);
                else Util.sendMessage(message, `Could not find ${inputs[0]} in the server.`).catch(console.error);
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
    }
}

module.exports = Command