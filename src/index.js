const Discord = require("discord.js");
const Canvas = require("canvas")
const Mongoose = require("mongoose")
const Settings = require("./settings.js")
const Util = require("./utils/util.js")

/**
 * Startup
 */
require("dotenv").config()
Canvas.registerFont("./assets/botfont.ttf", {family: "Pixel Font"})
const client = new Discord.Client();

Mongoose.connect(`mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@${process.env.DBCLUSTER}.${process.env.DBDOMAIN}.mongodb.net/data`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})


/**
 * Server Logs
 */
async function serverLogs() {
    const {createCanvas, loadImage} = require("canvas")

    while (true) {
        client.guilds.cache.forEach(async guild => {
            let settings = client.settings[guild.id]

            let channelId = await settings.getSetting("logchannel")
            let channel = Util.getChannelById(guild, channelId)
            if (!channel) return;

            let address = `${await settings.getSetting("ip")}:${await settings.getSetting("port")}`

            Util.request(`https://api.mcsrvstat.us/2/${address}.tld`, async (success, data) => {
                if (success) {
                    data = JSON.parse(data)
                    
                    let server = client.servers[address] ? client.servers[address] : {
                        players: [],
                        online: false,
                        start: true
                    }

                    if (data.online && !server.online) {
                        let flag = false
                        let messages = await channel.messages.fetch({limit: 10})
                        messages.forEach(message => {
                            if (message.content == ":white_check_mark: Server is online") {
                                flag = true
                            }
                        })

                        if (!flag) {
                            try {
                                channel.send(":white_check_mark: Server is online")
                                if (server.start) {
                                    channel.send(`There is ${data.players.online}/${data.players.max} players in the server.`)
                                }
                            } catch(e) {console.error(e)}
                        }
                    } else if (!data.online && server.online) {
                        try {
                            channel.send(":octagonal_sign: Server is offline")
                        } catch(e) {console.error(e)}
                    }

                    server.online = data.online

                    let old = server.players
                    let current = data.online && data.players.list ? data.players.list : []

                    if (!server.start) {
                        current.forEach(async (player) => {
                            if (!old.includes(player)) {
                                try {
                                    let image = createCanvas((16 + 21) * 13 + 26, 28)
                                    let context = image.getContext("2d")

                                    context.font = "17px 'Pixel Font'"
                                    context.textBaseline = "top"
                                    context.textAlign = "left"
                                    context.fillStyle = "#fff"

                                    let head = await loadImage(`https://mc-heads.net/avatar/${player}/22.png`)
                                    context.drawImage(head, 2, 2)
                                    context.fillText(`${player} has joined the game.`, 32, 2)

                                    channel.send({
                                        files: [{
                                            attachment: image.toBuffer("image/png"),
                                            name: "playeraction.png"
                                        }]
                                    })
                                } catch(e) {console.error(e)}
                            }
                        })

                        old.forEach(async (player) => {
                            if (!current.includes(player)) {
                                try {
                                    let image = createCanvas((16 + 19) * 13 + 26, 28)
                                    let context = image.getContext("2d")

                                    context.font = "17px 'Pixel Font'"
                                    context.textBaseline = "top"
                                    context.textAlign = "left"
                                    context.fillStyle = "#fff"

                                    let head = await loadImage(`https://mc-heads.net/avatar/${player}/22.png`)
                                    context.drawImage(head, 2, 2)
                                    context.fillText(`${player} has left the game.`, 32, 2)

                                    channel.send({
                                        files: [{
                                            attachment: image.toBuffer("image/png"),
                                            name: "playeraction.png"
                                        }]
                                    })
                                } catch(e) {console.error(e)}
                            }
                        })
                    }

                    server.players = current
                    server.start = false

                    client.servers[address] = server
                }
            })
        })

        await Util.sleep(10000)
    }
}


/**
 * Startup
 */
client.on("ready", () => {
    client.startTime = new Date()
    client.settings = []
    client.servers = []

    client.guilds.cache.forEach(guild => {
        client.settings[guild.id] = new Settings(guild);
    })

    client.commands = Util.loadmodules("commands", (command, commands) => {
        command = new command(client)
        commands.set(command.name(true), command)

        let aliases = command.aliases ? command.aliases() : null
        if (aliases) {
            for (let alias of aliases) {
                commands.set(alias.toLowerCase(), command)
            }
        }
    })

    client.user.setActivity("the stats", {
        type: "WATCHING"
    })

    console.log("Bot started successfully")

    await Util.sleep(1000)

    serverLogs()
});


/**
 * Guild creation
 */
client.on("guildCreate", guild => {
    if (!client.settings) client.settings = [];

    client.settings[guild.id] = new Settings(guild);
})

client.on("guildDelete", guild => {
    if (client.settings) {
        client.settings[guild.id] = null;
    }
})


/**
 * Command Help
 */
function commandHelp(message, command) {
    let scommand = [`${prefix}${command.name()}`]
    let fields = []

    if (command.numOfArguments() > 0) {
        command.arguments().forEach(arg => {
            scommand.push("``<" + arg.name + ">``")

            fields.push({
                inline: true,
                name: "<" + arg.name + ">",
                value: "*" + (arg.desc ? arg.desc : "No description") + "*"
            })
        })
    }

    let embed = {
        title: scommand.join(" "),
        color: 12333616,
        fields: fields
    }

    if (command.aliases().length > 0) {
        embed.description = `**Aliases:** ${command.aliases().join(", ")}`
    }

    message.reply({
        embed: embed
    })
}
 

/**
 * Command Parser
 */
async function parseCommand(message) {
    const settings = client.settings[message.guild.id]
    const prefix = await settings.getSetting("prefix")

    const content = message.content

    const isCommand = content.startsWith(prefix)
    let command, commandName, inputs

    if (isCommand) {
        [commandName, ...inputs] = content
            .trim()
            .substring(prefix.length)
            .split(" ");

        if (!commandName || commandName.length == 0) return;
    
        if (!client.commands) return console.error("Commands not loaded");

        command = client.commands.get(commandName.toLowerCase())

        if (!command) return Util.couldNotFind(message, "command", commandName);
    }

    message.command = command

    if (isCommand) {
        const permissions = command.permissions()

        if (!Util.doesMemberHavePermission(message.member, permissions)) {
            return Util.replyWarning(message, "You don't have permission to do that")
        }

        const arguments = command.numOfArguments()
        if (inputs.length < arguments) {
            if (inputs.length == 0) {
                return commandHelp(message, command)
            } else {
                return Util.replyError(message, `'${commandName.toLowerCase()}' expects ${arguments} argument(s), got ${inputs.length}`);
            }
        }

        let end = inputs.slice(arguments - 1).join(" ")
        inputs = inputs.slice(0, arguments - 1)
        inputs[arguments - 1] = end

        command.execute(message, inputs)
    }
}


/**
 * Message handling
 */
client.on("message", async message => {
    if (message.author.bot) return;

    if (!message.guild) {
        return Util.replyWarning(message, "Commands can only be used in a server that I am in")
    };

    parseCommand(message)
});


/**
 * Login
 */
client.login(process.env.TOKEN);