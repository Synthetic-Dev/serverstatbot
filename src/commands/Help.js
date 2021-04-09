const Discord = require("discord.js")
const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "help",
            desc: "Displays all permitted commands",
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
     * @param {CommandBase[]} commands
     * @param {string} desc 
     * @param {Array} fields 
     */
    async postCommands(message, commands, desc = "") {
        const settings = this.client.settings[message.guild.id]
        let prefix = await settings.get("prefix")
        let disabledCommands = await settings.get("disabledCommands")

        let pages = []
        let commandsPerPage = 18
        for (let i = 0; i < Math.ceil(commands.length / commandsPerPage); i++) {
            let fields = [
                {
                    name: "Commands",
                    value: "",
                    inline: true
                },
                {
                    name: "Description",
                    value: "",
                    inline: true
                }
            ]
    
            const truncateLength = 55
            commands.forEach((command, index) => {
                if (index < commandsPerPage * i || index >= commandsPerPage * (i + 1)) return;
                let disabled = disabledCommands.includes(command.name(true))
                fields[0].value += disabled ? `• ~~${command.name()}~~\n` : `• **${command.name()}**\n`
                fields[1].value += `- ${command.desc.slice(0, truncateLength) + (command.desc.length > truncateLength ? ".." : "")}\n`
            })

            pages[i] = {
                embed: {
                    title: "Commands",
                    description: `**Prefix: \`\`${prefix}\`\`**${desc}`,
                    fields: fields,
                    color: 5145560,
                    timestamp: Date.now(),
                    footer: Util.getFooter(this.client)
                }
            }
        }

        if (pages.length == 1) Util.sendMessage(message, pages[0]).catch(e => {
            console.error(`Help[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        });
        else Util.sendPages(message, pages);
    }

    /**
     * Get list of commands following check
     * @param {Discord.Collection} commands 
     * @param {Function} check 
     * @return {CommandBase[]}
     */
    getCommands(commands, check) {
        let newCommands = []

        commands.forEach(command => {
            if ((check && check(command)) || !check) {
                if (newCommands.includes(command)) return;
                newCommands.push(command)
            }
        })

        return newCommands
    }

    /**
     * Post embed containing command info
     * @param {Discord.Message} message 
     * @param {CommandBase} command 
     */
    async commandHelp(message, command) {
        const settings = this.client.settings[message.guild.id]
        let prefix = await settings.get("prefix")

        let scommand = [`${prefix}${command.name()}`]
        let args = ""
    
        if (command.numOfArguments() > 0) {
            command.arguments().forEach(arg => {
                if (arg.optional) {
                    scommand.push(`\`\`[${arg.multiple ? "..." : ""}${arg.name}]\`\``)
                    args += `\`\`[${arg.multiple ? "..." : ""}${arg.name}]\`\` - ${arg.desc ? arg.desc : "No description"}\n`
                } else {
                    scommand.push(`\`\`<${arg.multiple ? "..." : ""}${arg.name}>\`\``)
                    args += `\`\`<${arg.multiple ? "..." : ""}${arg.name}>\`\` - ${arg.desc ? arg.desc : "No description"}\n`
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
        }).catch(e => {
            console.error(`Help[replyMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }

    async execute(message, inputs) {
        if (inputs[0]) {
            const command = this.client.commands.get(inputs[0].toLowerCase())
            if (!command) return Util.couldNotFind(message, "command", inputs[0]);
            if (!Util.doesMemberHavePermission(message.member, command.permissions())) return command.secret ? null : Util.replyWarning(message, "You don't have permission to do that");
            return this.commandHelp(message, command)
        }

        let commands = this.getCommands(this.client.commands, (command) => {
            const permissions = command.permissions()
            return command != this && !command.private && Util.doesMemberHavePermission(message.member, permissions)
        })

        const settings = this.client.settings[message.guild.id]
        let prefix = await settings.get("prefix")

        this.postCommands(message, commands, `\n${"—".repeat(5)}\nRequires a minecraft server running a supported version, to see supported versions do \`\`${prefix}versions\`\`\n\nTo get more information about a command do \`\`${prefix}help [command]\`\``)
    }
}

module.exports = Command