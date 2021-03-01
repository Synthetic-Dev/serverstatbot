const Discord = require("discord.js")
const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "help",
            desc: "Displays all available commands",
            aliases: [
                "cmds"
            ]
        })
    }

    /**
     * Post a formatted commands message
     * @param {Discord.Message} message
     * @param {string} desc 
     * @param {Array} fields 
     */
    postCommands(message, desc, commandliststring) {
        Util.sendMessage(message, {
            embed: {
                title: "Commands",
                description: `${desc}\n${commandliststring}`,
                color: 5145560,
                footer: Util.getFooter(this.client)
            }
        })
    }

    /**
     * 
     * @param {Discord.Collection} commands 
     * @param {Function} check 
     * @return {string}
     */
    getCommands(commands, check) {
        let modules = []
        let string = ""

        commands.forEach(command => {
            if ((check && check(command)) || !check) {
                if (modules.includes(command)) return;

                let scommand = [`${command.name()}`]
    
                if (command.numOfArguments() > 0) {
                    command.arguments().forEach(arg => {
                        if (arg.optional) scommand.push(`\`\`[${arg.name}]\`\``);
                        else scommand.push(`\`\`<${arg.name}>\`\``)
                    })
                }
    
                string += `• **${scommand.join(" ")}** - *${command.desc}*\n`
                modules.push(command)
            }
        })

        return string
    }

    async execute(message) {
        const settings = this.client.settings[message.guild.id]

        let commandliststring = this.getCommands(this.client.commands, (command) => {
            const permissions = command.permissions()
            return command != this && !command.private && Util.doesMemberHavePermission(message.member, permissions)
        })

        let prefix = await settings.getSetting("prefix")
        this.postCommands(message, `**Disclaimer: This bot still underdevelopment and bugs/issues may arise, if you would like to report an issue you can report it in our support server:** [Join server](https://discord.gg/uqVp2XzUP8)\n\nRequires a minecraft server running a supported version with \`\`enable-query=true\`\`, to see supported versions do \`\`${prefix}versions\`\`\n**Prefix: \`\`${prefix}\`\`**`, commandliststring)

        // Setup help message
        let ip = await settings.getSetting("ip")

        if (Util.doesMemberHavePermission(message.member, ["ADMINISTRATOR"]) && (ip == "0.0.0.0" || ip == "")) {
            Util.sendMessage(message.channel, {
                embed: {
                    title: "Setup",
                    description: "Get your server connected and setup!",
                    color: 5145560,
                    fields: [
                        {
                            name: "Add your server ip",
                            value: `Do **${prefix}setip** \`\`<your ip here>\`\``,
                            inline: true
                        },
                        {
                            name: "Set your server port",
                            value: `The server port defaults to **25565**, if your server uses a different port do **${prefix}setport** \`\`<your port here>\`\``,
                            inline: true
                        },
                        {
                            name: "Set up a log channel",
                            value: `This is where server status and join/leave messages will be posted. Make sure that the bot has permission to post in this channel! Do **${prefix}setlogchannel** \`\`<channel or 'here' or 'clear'>\`\``
                        },
                        {
                            name: "Need support?",
                            value: `Join the bot support server here: [Join server](https://discord.gg/uqVp2XzUP8)`
                        }
                    ]
                }
            })
        }
    }
}

module.exports = Command