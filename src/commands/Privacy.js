const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "privacy",
            desc: "View the our privacy policy",
            aliases: [
                "policy",
                "privacypolicy"
            ]
        })
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]
        let prefix = await settings.get("prefix")

        Util.sendMessage(message, {
            embed: {
                title: "Privacy Policy",
                color: 5145560,
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                description: "*We reserve the right to make changes and updates to our privacy policy without notifying any of our users.*",
                fields: [
                    {
                        name: "What data do we store?",
                        value: "• The custom prefix in your server will be stored\n• If you add a server address, that ip/hostname and port are stored\n• If you setup a log channel the guild id and channel id are stored\n• If you disable any commands the guild id and list of disabled commands are stored"
                    },
                    {
                        name: "Why do we store your information?",
                        value: "• We store your custom prefix in order for you to run commands with the prefix you specifiy\n• Your server address and port are used in order to get information from your minecraft server without the information being reentered every time\n• Log channel id's are stored so we know where to send log messages in your guild\n• Disabled commands are stored so we know what commands to deny users from running in your guild"
                    },
                    {
                        name: "Who can view this data?",
                        value: `• You can view all of your settings using the \`\`${prefix}settings\`\` command\n• Only the developer of this bot has access to your stored data`
                    },
                    {
                        name: "Do you have any questions?",
                        value: "If you would like information on a specific matter or would like your data to be deleted please [join support server](https://discord.gg/uqVp2XzUP8)"
                    }
                ],
                timestamp: Date.now(),
                footer: Util.getFooter(this.client)
            }
        }).catch(console.error)
    }
}

module.exports = Command