const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "support",
            desc: "Support info for the bot",
            aliases: [
                "suprt",
                "spt"
            ]
        })
    }

    async execute(message) {
        const onlineFor = Math.abs(((new Date()).getTime() - this.client.startTime.getTime()) / 1000)

        Util.sendMessage(message, {
            embed: {
                title: "Support",
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                color: 5145560,
                fields: [
                    {
                        name: "Support the bot",
                        value: "**[Donate](https://www.paypal.com/donate?hosted_button_id=F9CPBU97FFXYU)**"
                    },
                    {
                        name: "Support server",
                        value: "[Join support server](https://discord.gg/uqVp2XzUP8)"
                    }
                ],
                footer: {
                    text: `Uptime: ${Math.floor(onlineFor / 3600)}h ${Math.floor((onlineFor / 60) % 60)}m ${Math.floor(onlineFor % 60)}s | Copyright 2021 © All rights reserved.`
                }
            }
        })
    }
}

module.exports = Command