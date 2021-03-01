const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
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
        let versions = ""

        Protocol.getPrimarySupportedVersions().forEach(version => {
            versions += `• ${Protocol.getSupportedVersions().filter(subversion => subversion.includes(version)).join(", ")}\n`
        })

        Util.sendMessage(message, {
            embed: {
                title: "Supported Versions",
                description: `**Disclaimer: Modded versions using forge are supported, however versions 1.16+ may not work as intended.**\n\nA list of all supported minecraft versions:\n${versions.trim()}\n\n`,
                color: 5145560,
                footer: Util.getFooter(this.client)
            }
        })
    }
}

module.exports = Command