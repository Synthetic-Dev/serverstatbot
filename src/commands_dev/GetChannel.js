const Discord = require("discord.js")

const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "getchannel",
            descId: "COMMAND_DEV_CHANNEL",
            aliases: ["channel"],
            args: [
                {
                    name: "channel",
                    descId: "COMMAND_DEV_CHANNEL_ARG1",
                },
            ],
            perms: ["DEV"],
            private: true,
        })
    }

    async execute(options) {
        let channel = Util.getChannelById(
            this.client.channels,
            options.inputs[0]
        )
        if (!channel)
            return Util.couldNotFind(
                options.message,
                options.lang.CHANNEL,
                options.inputs[0]
            )

        const embed = new Discord.MessageEmbed()
            .setTitle(
                options.lang.COMMAND_DEV_CHANNEL_TITLE.format(channel.name)
            )
            .setDescription(
                options.lang.COMMAND_DEV_CHANNEL_DESC.format(
                    channel.id,
                    channel.guild.id,
                    channel.viewable,
                    channel.messages.cache.size,
                    channel
                        .permissionsFor(channel.guild.me)
                        .toArray()
                        .join("`, `")
                )
            )
            .setColor(4317012)
            .setTimestamp()

        Util.sendMessage(options.message, embed).catch((e) => {
            Util.error(e, "Dev_Channel", "sendMessage")
        })
    }
}

module.exports = Command
