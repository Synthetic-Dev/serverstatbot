const OSUtils = require("node-os-utils")
const { getAverageColor } = require("fast-average-color-node")
const Util = require("../utils/util.js")
const Mojang = require("../utils/mojang.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "embed",
            descId: "COMMAND_DEV_EMBED",
            args: [
                {
                    name: "action",
                    descId: "COMMAND_DEV_EMBED_ARG1"
                },
                {
                    name: "",
                    multiple: true
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(options) {
        const actions = {
            send: true,
            edit: false
        }
        let action = options.inputs[0].toLowerCase()
        let state = actions[action]
        if (state == null) {
            return Util.replyError(options.message, `Invalid action, actions: \`\`${Object.keys(actions).join("``, ``")}\`\``)
        }

/*
{
    description: "**You can invite the bot from one of these sites:**\n• [top.gg](https://top.gg/bot/759415210628087841)\n• [bots.gg](https://discord.bots.gg/bots/759415210628087841)\n• [discordbotlist.com](https://discordbotlist.com/bots/server-stat)\n• [botsfordiscord.com](https://botsfordiscord.com/bot/759415210628087841)\n• [discordextremelist.xyz](https://discordextremelist.xyz/en-US/bots/759415210628087841)",
    author: {
        name: this.client.user.username,
        icon_url: this.client.user.avatarURL({
            size: 64,
            dynamic: true,
            format: "png"
        })
    },
    color: 5145560,
    footer: Util.getFooter(options.message, false)
}
*/

/*
{title: "The Rules", description: `Make sure to follow all rules carefully, and at all times!

> **1.** You must be civil and respectful to all members of the guild, any acts of violence, disrespect, harassment, racism or inappropriate language will lead to a permanent ban.

> **2.** You should not spam, advertise/self-promote or mass ping in any channel. If committed twice it will end in a permanent ban.

> **3.** This is a clean server and absolutely no NSFW, sexual or obscene content will be tolerated in this server and will lead to a permanent ban if posted.

> **4.** Repeated feedback or support questions will lead to a warning or a mute if committed multiple times. Always check to see if your question/feedback has already been answered or posted.

> **5.** Impersonation of the developers, staff or any members of this discord is not allowed.

> **6.** Everything you do and say within this discord must always follow the discord [Terms of Service](https://discord.com/terms) and [Community Guildlines](https://discord.com/guidelines).

*These rules may be changed at any time without notice and by being in this server you automatically agree to these rules at all times*`,
author: {
        name: this.client.user.username,
        icon_url: this.client.user.avatarURL({
            size: 64,
            dynamic: true,
            format: "png"
        })
    },
    color: 5145560,
    footer: Util.getFooter(options.message, false)
}
*/

        if (state) {
            let argumentCount = 2
            let end = options.inputs.slice(argumentCount - 1).join(" ")
            options.inputs = options.inputs.slice(0, argumentCount - 1)
            options.inputs[argumentCount - 1] = end

            eval(`Util.sendMessage(options.channel, {
                embed: ${options.inputs[1]}
            }).catch(e => {
                Util.replyError(options.message, \`Error sending embed: \${e}\`)
            })`)
        } else {
            let argumentCount = 3
            let end = options.inputs.slice(argumentCount - 1).join(" ")
            options.inputs = options.inputs.slice(0, argumentCount - 1)
            options.inputs[argumentCount - 1] = end

            let embedMessage = await Util.getMessageInChannel(options.channel, options.inputs[1])
            if (!embedMessage) return Util.couldNotFind(options.message, "message", options.inputs[1], "channel")

            let newEmbed = options.inputs[2]
            if (!newEmbed) return Util.replyError("Expected embed content")
            try {
                newEmbed = JSON.parse(options.inputs[2])
            } catch (e) {
                return Util.replyError(options.message, `Error parsing embed: ${e}`)
            }

            embedMessage.edit({
                embed: newEmbed
            }).catch(e => {
                Util.replyError(options.message, `Error editing embed: ${e}`)
            })
        }
    }
}

module.exports = Command