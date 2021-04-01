const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "versions",
            desc: "Lists all minecraft versions that the bot supports",
            aliases: [
                "vers"
            ]
        })
    }

    async execute(message) {

        Util.sendMessage(message, {
            embed: {
                title: "Supported Versions",
                description: `**Disclaimer: Modded versions using forge are supported, however some versions of forge may not work as intended.**\n\nMinecraft Java versions ${Protocol.getMinSupportedVersion()}+ and all official Minecraft Bedrock versions are supported.`,
                color: 5145560,
                timestamp: Date.now(),
                footer: Util.getFooter(this.client)
            }
        }).catch(console.error)
    }
}

module.exports = Command