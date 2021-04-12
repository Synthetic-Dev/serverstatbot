const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "channel",
            desc: "Gets information about a channel",
            args: [
                {
                    name: "server",
                    desc: "GuildId for the server"
                },
                {
                    name: "channel",
                    desc: "ChannelId for the channel"
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(message, inputs) {
        Util.getGuildById(this.client, inputs[0]).then(guild => {
            let channel = Util.getChannelById(guild, inputs[1])
            if (!channel) return Util.replyError(message, "Unknown channel")
            Util.sendMessage(message, {
                embed: {
                    title: `Channel: ${channel.name}`,
                    description: `**Id:** \`\`${channel.id}\`\`\n**Viewable:** \`\`${channel.viewable}\`\`\n\n**Permissions:**\n\`\`${channel.permissionsFor(channel.guild.me).toArray().join("``, ``")}\`\``
                }
            }).catch(e => {
                console.error(`Channel[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
            })
        }).catch(err => {
            Util.replyError(message, "Error while getting guild")
            console.error(err)
        })
    }
}

module.exports = Command