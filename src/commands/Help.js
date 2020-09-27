const discord = require("discord.js")
const util = require("../util.js")

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
     * @param {string} desc 
     * @param {Array} fields 
     */
    postCommands(channel, desc, fields) {
        channel.send({
            embed: {
                title: "Commands",
                description: desc,
                color: 5145560,
                fields: fields
            }
        })
    }

    /**
     * 
     * @param {discord.Collection} commands 
     * @param {Function} check 
     * @return {Array}
     */
    getCommands(commands, check) {
        let fields = []
        let modules = []

        commands.forEach(command => {
            if ((check && check(command)) || !check) {
                if (modules.includes(command)) return;

                let field = {
                    inline: true
                }

                let scommand = [`${command.name()}`]
    
                if (command.numOfArguments() > 0) {
                    command.arguments().forEach(arg => {
                        scommand.push("``<" + arg.name + ">``")
                    })
                }
    
                field.name = scommand.join(" ")
                field.value = `*${command.desc}*`
    
                fields.push(field)
                modules.push(command)
            }
        })

        return fields
    }

    async execute(inputs, message) {
        const settings = this.client.settings[message.guild.id]

        let commands = this.getCommands(this.client.commands, (command) => {
            const permissions = command.permissions()
            if (command != this && !command.private && util.doesUserHavePermission(message.member, permissions)) return true;
            return false;
        })

        this.postCommands(message.channel, `Prefix: ${await settings.getSetting("prefix")}`, commands)
    }
}

module.exports = Command