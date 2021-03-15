const Discord = require("discord.js")
const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "help",
            desc: "Displays all available commands",
            aliases: [
                "cmds"
            ],
            args: [
                {
                    name: "command",
                    desc: "A command to get help about",
                    optional: true
                }
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
     * Get formatted commands string
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

    /**
     * Post embed containing command info
     * @param {Discord.Message} message 
     * @param {CommandBase} command 
     * @param {string} prefix 
     */
    commandHelp(message, command, prefix) {
        let scommand = [`${prefix}${command.name()}`]
        let args = ""
    
        if (command.numOfArguments() > 0) {
            command.arguments().forEach(arg => {
                if (arg.optional) {
                    scommand.push(`\`\`[${arg.name}]\`\``)
                    args += `**[${arg.name}]** - *${arg.desc ? arg.desc : "No description"}*\n`
                } else {
                    scommand.push(`\`\`<${arg.name}>\`\``)
                    args += `**<${arg.name}>** - *${arg.desc ? arg.desc : "No description"}*\n`
                }
            })
        }
    
        let embed = {
            title: scommand.join(" "),
            description: `**Description:** ${command.desc}\n` + (command.aliases().length > 0 ? `**Aliases:** ${command.aliases().join(", ")}\n` : "") + `**Arguments:**${command.numOfArguments() > 0 ? `\n${args.trim()}` : " None"}`,
            color: 12333616
        }
    
        Util.replyMessage(message, {
            embed: embed
        })
    }

    async execute(message, inputs) {
        const settings = this.client.settings[message.guild.id]

        let prefix = await settings.get("prefix")

        if (inputs[0]) {
            const command = this.client.commands.get(inputs[0].toLowerCase())
            if (!command) return Util.couldNotFind(message, "command", inputs[0]);
            if (!Util.doesMemberHavePermission(message.member, command.permissions())) return command.secret ? null : Util.replyWarning(message, "You don't have permission to do that");
            return this.commandHelp(message, command, prefix)
        }

        let commandliststring = this.getCommands(this.client.commands, (command) => {
            const permissions = command.permissions()
            return command != this && !command.private && Util.doesMemberHavePermission(message.member, permissions)
        })

        this.postCommands(message, `**Prefix:   \`\`${prefix}\`\`**\n${"—".repeat(5)}\nRequires a minecraft server running a supported version, to see supported versions do \`\`${prefix}versions\`\`\n`, commandliststring)
    }
}

module.exports = Command