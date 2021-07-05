const Discord = require("discord.js")
const { MessageButton, MessageActionRow } = require("discord-buttons")

const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "donate",
            descId: "COMMAND_DONATE",
        })
    }

    async execute(options) {
        const embed = new Discord.MessageEmbed()
            .setDescription(options.lang.COMMAND_DONATE_DESC)
            .setColor(5145560)
            .setAuthor(
                this.client.user.username,
                this.client.user.avatarURL({
                    size: 64,
                    dynamic: true,
                    format: "png",
                })
            )
        /*
        .setFooter(Util.getFooter(options.message).text)
        .setTimestamp()
        */

        let button = new MessageButton()
            .setStyle("url")
            .setLabel(options.lang.COMMAND_DONATE_BUTTON)
            .setURL("https://donatebot.io/checkout/797779595852120064")

        let row = new MessageActionRow().addComponent(button)

        Util.sendMessage(options.message, {
            embed: embed,
            component: row,
        }).catch((e) => {
            Util.error(e, "Donate", "sendMessage")
        })
    }
}

module.exports = Command
