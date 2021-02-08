const Discord = require("discord.js")
const Canvas = require("canvas")
const Mongoose = require("mongoose")
const Settings = require("./settings.js")
const Util = require("./utils/util.js")
const Protocol = require("./utils/protocol.js")

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
    if (process.env.ISDEV == "TRUE") return;

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

            const ip = await settings.getSetting("ip")
            const port = await settings.getSetting("port")

            let server = client.servers[guild.id] ? client.servers[guild.id] : {
                ip: ip,
                port: port,
                players: [],
                online: false,
                start: true
            }

            if (server.ip != ip || server.port != port) {
                server = {
                    ip: ip,
                    port: port,
                    players: [],
                    online: false,
                    start: true
                }
            } 

            let onlinetext = ":white_check_mark: Server is online"
            let offlinetext = ":octagonal_sign: Server is offline"

            let onlineMessage = await Util.getRecentMessage(channel, onlinetext)
            let offlineMessage = await Util.getRecentMessage(channel, offlinetext)

            Protocol.ping(ip, port).then(async data => {
                if (!server.online) {
                    if ((!onlineMessage && !offlineMessage) || (!onlineMessage && offlineMessage) || (onlineMessage && offlineMessage && Util.isMessageMoreRecent(offlineMessage, onlineMessage))) {
                        Util.sendMessage(channel, onlinetext)

                        if (server.start) {
                            Util.sendMessage(channel, {
                                embed: {
                                    title: "Server",
                                    description: (restarted ? ":exclamation: Bot updated or restarted :exclamation:\n" : "") + `There is ${data.players.online}/${data.players.max} players in the server.`,
                                    color: 5145560
                                }
                            })
                        }
                    }
                }

                server.online = true

                let old = server.players
                let current = data.players.sample ? data.players.sample : []

                if (!data.players.sample && data.players.online > 0) {
                    let text = ":warning: Server has too many players online to log activity"
                    let message = await Util.getRecentMessage(channel, text)

                    if (!message) {
                        Util.sendMessage(channel, text)
                    }
                } else {
                    if (!server.start) {
                        current.forEach(async (player) => {
                            if (old.filter(plr => plr.id == player.id).length == 0) {
                                let image = createCanvas((16 + 21) * 13 + 26, 28)
                                let context = image.getContext("2d")

                                context.font = "17px 'Pixel Font'"
                                context.textBaseline = "top"
                                context.textAlign = "left"
                                context.fillStyle = "#fff"

                                loadImage(`https://mc-heads.net/avatar/${player.name}/22.png`).then(head => {
                                    context.drawImage(head, 2, 2)
                                    context.fillText(`${player.name} has joined the game.`, 32, 2)

                                    Util.sendMessage(channel, {
                                        files: [{
                                            attachment: image.toBuffer("image/png"),
                                            name: "playeraction.png"
                                        }]
                                    })
                                }).catch(error => {
                                    Util.sendMessage(channel, `${player.name} has joined the game.`)
                                })
                            }
                        })

                        old.forEach(async (player) => {
                            if (current.filter(plr => plr.id == player.id).length == 0) {
                                let image = createCanvas((16 + 19) * 13 + 26, 28)
                                let context = image.getContext("2d")

                                context.font = "17px 'Pixel Font'"
                                context.textBaseline = "top"
                                context.textAlign = "left"
                                context.fillStyle = "#fff"

                                loadImage(`https://mc-heads.net/avatar/${player.name}/22.png`).then(head => {
                                    context.drawImage(head, 2, 2)
                                    context.fillText(`${player.name} has left the game.`, 32, 2)

                                    Util.sendMessage(channel, {
                                        files: [{
                                            attachment: image.toBuffer("image/png"),
                                            name: "playeraction.png"
                                        }]
                                    })
                                }).catch(error => {
                                    Util.sendMessage(channel, `${player.name} has left the game.`)
                                })
                            }
                        })
                    }
                }

                server.players = current
            }).catch(async error => {
                let wasOnline = server.online
                server.online = false

                if (error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                    if (wasOnline || server.start) {
                        if ((!onlineMessage && !offlineMessage) || (!offlineMessage && onlineMessage) || (onlineMessage && offlineMessage && Util.isMessageMoreRecent(onlineMessage, offlineMessage))) {
                            Util.sendMessage(channel, offlinetext)
                        }
                    }

                    return
                } else if (error.code == "ENOTFOUND") {
                    let text = ":warning: Could not find server, check that a valid ip and port is set, and is the server running a supported version?"
                    let message = await Util.getRecentMessage(channel, text)

                    if (!message) {
                        Util.sendMessage(channel, text)
                    }
                    return
                }
                
                let text = ":stop_sign: An error occured when trying to get server info"
                if (!(await Util.getRecentMessage(channel, text))) {
                    Util.sendMessage(channel, text)
                }

                console.error(error)
            }).finally(() => {
                server.start = false

                client.servers[guild.id] = server
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
    let args = ""

    if (command.numOfArguments() > 0) {
        command.arguments().forEach(arg => {
            scommand.push(`\`\`<${arg.name}>\`\``)

            args += `**<${arg.name}>** - *${arg.desc ? arg.desc : "No description"}*\n`
        })
    }

    let embed = {
        title: scommand.join(" "),
        description: (command.aliases().length > 0 ? `**Aliases:** ${command.aliases().join(", ")}\n` : "") + args.trim(),
        color: 12333616
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
 * Raw event emitter
 */
client.on("raw", async packet => {
    let reactionEvents = [
        "MESSAGE_REACTION_ADD",
        "MESSAGE_REACTION_REMOVE",
        "MESSAGE_REACTION_REMOVE_ALL",
    ]

    if (reactionEvents.includes(packet.t)) {
        const guild = await Util.getGuildById(client, packet.d.guild_id)
        const channel = Util.getChannelById(guild, packet.d.channel_id)

        if (channel.messages.cache.has(packet.d.message_id)) return;

        channel.messages.fetch(packet.d.message_id).then(async message => {
            if (packet.t === "MESSAGE_REACTION_REMOVE_ALL") {
                client.emit("messageReactionRemoveAll", message);
                return
            }
            
            const emoji = packet.d.emoji.id ? packet.d.emoji.id : packet.d.emoji.name
            const reaction = message.reactions.cache.get(emoji)
            const user = await client.users.fetch(packet.d.user_id)
            
            if (packet.t === "MESSAGE_REACTION_ADD") {
                client.emit("messageReactionAdd", reaction, user);
            }
            if (packet.t === "MESSAGE_REACTION_REMOVE") {
                client.emit("messageReactionRemove", reaction, user);
            }
        });
    }
});


/**
 * Login
 */
client.login(process.env.TOKEN);