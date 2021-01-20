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

    await Util.sleep(1000)

    let restarted = true

    while (true) {
        client.guilds.cache.forEach(async guild => {
            let settings = client.settings[guild.id]

            let channelId = await settings.getSetting("logchannel")
            let channel = Util.getChannelById(guild, channelId)
            if (!channel) return;

            if (!Util.doesMemberHavePermissionsInChannel(guild.me, channel, ["SEND_MESSAGES"])) {
                settings.setSetting("logchannel", "0")

                let priorityChannel = Util.getPriorityChannel(guild)
                if (priorityChannel && Util.doesMemberHavePermissionsInChannel(guild.me, priorityChannel, ["SEND_MESSAGES"])) {
                    Util.sendError(priorityChannel, "I do not have permission to send messages in the log channel! Log channel has been removed.")
                } else {
                    console.log(`Did not have permissions to send messages in (${guild.id}) ${guild.name}'s log channel and could not find/send message in priority channel.`)
                }
                return
            };

            let address = `${await settings.getSetting("ip")}:${await settings.getSetting("port")}`

            Util.request(`https://api.mcsrvstat.us/2/${address}.tld`, async (success, data) => {
                if (success) {
                    success = false
                    try {
                        data = JSON.parse(data)
                        success = true
                    } catch(e) {
                        console.error(e)
                    }

                    if (!success) {
                        let text = ":stop_sign: An error occured when trying to gather server info"
                        let message = await Util.getRecentMessage(channel, text)

                        if (!message) {
                            Util.sendMessage(channel, text)
                        }
                        return
                    };

                    if (!data.ip || !data.port) {
                        let text = ":warning: An invalid ip or port is set, cannot gather server info"
                        let message = await Util.getRecentMessage(channel, text)

                        if (!message) {
                            Util.sendMessage(channel, text)
                        }
                        return
                    };
                    
                    let server = client.servers[address] ? client.servers[address] : {
                        players: [],
                        online: false,
                        start: true
                    }

                    let restarttext = ":bulb: Bot restarted or updated, loading server..."
                    if (restarted) {
                        let message = await Util.getRecentMessage(channel, restarttext)
                        if (message && message.recency <= 2) {
                            let content = message.content
                            let match = content.match(/x\d$/)
                            if (match && match[0]) {
                                match = match[0]
                                let num = Number(match.substring(1))
                                if (isNaN(num)) num = 2;
                                content = content.substring(0, content.length - match.length) + "x" + num
                            } else {
                                content += " x2"
                            }

                            try {
                                message.edit(content)
                            } catch(e) {
                                console.error(e)
                            }
                        } else {
                            Util.sendMessage(channel, restarttext)
                        }
                    }

                    let onlinetext = ":white_check_mark: Server is online"
                    let offlinetext = ":octagonal_sign: Server is offline"

                    let onlineMessage = await Util.getRecentMessage(channel, onlinetext)
                    let offlineMessage = await Util.getRecentMessage(channel, offlinetext)

                    if (data.online && !server.online) {
                        if (restarted || (!onlineMessage && !offlineMessage) || (!onlineMessage && offlineMessage) || (onlineMessage && offlineMessage && Util.isMessageMoreRecent(offlineMessage, onlineMessage))) {
                            Util.sendMessage(channel, onlinetext)
                            if (server.start) {
                                Util.sendMessage(channel, `There is ${data.players.online}/${data.players.max} players in the server.`)
                            }
                        }
                    } else if (!data.online && (server.online || server.start)) {
                        if (restarted || (!onlineMessage && !offlineMessage) || (!offlineMessage && onlineMessage) || (onlineMessage && offlineMessage && Util.isMessageMoreRecent(onlineMessage, offlineMessage))) {
                            Util.sendMessage(channel, offlinetext)
                        }
                    }

                    server.online = data.online

                    let old = server.players
                    let current = data.online && data.players.list ? data.players.list : []

                    if (data.online) {
                        if (data.players.online > 200) {
                            let text = ":warning: Server has too many players online to log activity"
                            let message = await Util.getRecentMessage(channel, text)

                            if (!message) {
                                Util.sendMessage(channel, text)
                            }
                        } else {
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

                                            Util.sendMessage(channel, {
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

                                            Util.sendMessage(channel, {
                                                files: [{
                                                    attachment: image.toBuffer("image/png"),
                                                    name: "playeraction.png"
                                                }]
                                            })
                                        } catch(e) {console.error(e)}
                                    }
                                })
                            }
                        }
                    }

                    server.players = current
                    server.start = false

                    client.servers[address] = server
                }
            })
        })

        await Util.sleep(20000)

        restarted = false
    }
}


/**
 * Activity displays
 */
async function activityDisplay() {
    const activities = [
        {
            text: "commands | .help",
            type: "PLAYING"
        },
        {
            text: "support | discord.gg/uqVp2XzUP8",
            type: "PLAYING"
        },
        {
            text: () => {
                return `${client.guilds.cache.size} servers`
            },
            type: "WATCHING"
        }
    ]

    while (true) {
        for (activity of activities) {
            client.user.setActivity(typeof activity.text == "function" ? activity.text() : activity.text, {
                type: activity.type
            })
    
            await Util.sleep(10000)
        }
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

    console.log("Bot started successfully")

    serverLogs()
    activityDisplay()
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
function commandHelp(message, command, prefix) {
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

    Util.replyMessage(message, {
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
            return command.secret ? null : Util.replyWarning(message, "You don't have permission to do that")
        }

        const arguments = command.numOfArguments()
        if (inputs.length < arguments) {
            if (inputs.length == 0) {
                return command.secret ? null : commandHelp(message, command, prefix)
            } else {
                return command.secret ? null : Util.replyError(message, `'${commandName.toLowerCase()}' expects ${arguments} argument(s), got ${inputs.length}`);
            }
        }

        let end = inputs.slice(arguments - 1).join(" ")
        inputs = inputs.slice(0, arguments - 1)
        inputs[arguments - 1] = end

        try {
            command.execute(message, inputs)
        } catch(e) {
            Util.replyError(message, "An error occured while trying to execute that command, please report this to the developer!")
            console.error(e)
        }
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