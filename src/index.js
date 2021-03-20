const Heroku = require('heroku-client')
const OSUtils = require("node-os-utils")
const Discord = require("discord.js")
const Canvas = require("canvas")
const Mongoose = require("mongoose")
const Util = require("./utils/util.js")
const Settings = require("./utils/settings.js")
const Protocol = require("./utils/protocol.js")

/**
 * Startup
 */
require("dotenv").config()
OSUtils.options.INTERVAL = 2000
Canvas.registerFont("./assets/botfont.ttf", {family: "Pixel Font"})

const client = new Discord.Client();
if (process.env.HEROKUAPIKEY) {
    client.heroku = new Heroku({token: process.env.HEROKUAPIKEY})
}

Mongoose.connect(`mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@${process.env.DBCLUSTER}.${process.env.DBDOMAIN}.mongodb.net/data`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})


/**
 * Server Logs
 */
function serverLogs() {
    if (process.env.ISDEV == "TRUE") return;

    const statusContents = {
        online: "<:green_circle_with_tick:818512512500105249> Server is online",
        offline: "<:red_circle_with_cross:818512512764084265> Server is offline",
        restart: ":arrows_counterclockwise: Server restarted"
    }

    const statuses = [
        {
            content: statusContents.online,
            type: "online"
        },
        {
            content: statusContents.restart,
            type: "online"
        },
        {
            content: statusContents.offline,
            type: "offline"
        }
    ]

    const intervalTime = 60*1000
    const restartTime = 24*60*60*1000

    client.servers = []
    client.setInterval(async () => {
        if (Date.now() - client.startTime >= restartTime) {
            const restartCommand = client.commands.get("restart")
            restartCommand.restart()
            return
        }

        if (await client.globalSettings.get("maintenance")) return;

        client.guilds.cache.forEach(async guild => {
            let settings = client.settings[guild.id]

            let channelId = await settings.get("logchannel")
            let channel = Util.getChannelById(guild, channelId)
            if (!channel) return;

            if (!Util.doesMemberHavePermissionsInChannel(guild.me, channel, ["SEND_MESSAGES"])) {
                settings.set("logchannel", "0")

                let priorityChannel = Util.getPriorityChannel(guild, chl => Util.doesMemberHavePermissionsInChannel(guild.me, chl, ["SEND_MESSAGES"]))
                if (priorityChannel) {
                    Util.sendError(priorityChannel, "I do not have permission to send messages in the log channel! Log channel has been removed.")
                } else {
                    console.log(`Did not have permissions to send messages in (${guild.id}) ${guild.name}'s log channel and could not find/send message in priority channel.`)
                }
                return
            };

            const ip = await settings.get("ip")
            const port = await settings.get("port")

            let server = client.servers[guild.id] ? client.servers[guild.id] : {
                ip: ip,
                port: port,
                players: [],
                online: false,
                start: true,
                statusMessage: {
                    message: null,
                    type: "none"
                }
            }

            if (server.ip != ip || server.port != port) {
                server.ip = ip;
                server.port = port;
                server.players = [];
                server.online = false;
                server.start = true;
            }

            if (!server.statusMessage.message) {
                await new Promise((resolve, reject) => {
                    let done = 0
                    statuses.forEach((status, index) => {
                        Util.getRecentMessage(channel, status.content).then(message => {
                            if (message) {
                                if (server.statusMessage.message && Util.isMessageMoreRecent(message, server.statusMessage.message)) {
                                    server.statusMessage.message = message
                                    server.statusMessage.type = status.type
                                }
                            }

                            done++
                        }).catch(console.error).finally(() => {
                            if (done == statuses.length) resolve();
                        })
                    })
                })
            }

            Protocol.getInfo(ip, port, false).then(async data => {
                if (data.online) {
                    if (!server.online) {
                        if (["none", "offline"].includes(server.statusMessage.type)) {
                            if (!server.start && server.statusMessage.message && server.statusMessage.message.member == guild.me && Date.now() - server.statusMessage.message.createdTimestamp < 120*1000) {
                                server.statusMessage.message.edit(statusContents.restart)
                            } else {
                                Util.sendMessage(channel, statusContents.online).then(message => {
                                    server.statusMessage.message = message
                                    server.statusMessage.type = "online"
                                }).catch(console.error)
                            }
                        }
                    }

                    server.online = true

                    let old = server.players
                    let current = data.players.sample ? data.players.sample : []

                    if (!data.players.sample && data.players.online > 0) {
                        let text = ":warning: Server has too many players online to log activity"
                        Util.getRecentMessage(channel, text).then(message => {
                            if (!message) Util.sendMessage(channel, text).catch(console.error)
                        }).catch(console.error)
                    } else if (server.start && !data.query) {
                        let text = ":warning: ``enable-query=true`` is required for join logs"
                        Util.getRecentMessage(channel, text).then(message => {
                            if (!message) Util.sendMessage(channel, text).catch(console.error)
                        }).catch(console.error)
                    } else if (data.bedrock) {
                        let text = ":warning: Bedrock servers do not return all players online."
                        Util.getRecentMessage(channel, text).then(message => {
                            if (!message) Util.sendMessage(channel, text).catch(console.error)
                        }).catch(console.error)
                    } else if (data.query && current.length == data.players.online) {
                        if (!server.start) {
                            function playerMessage(player, text) {
                                let image = Canvas.createCanvas((16 + 21) * 13 + 26, 28)
                                let context = image.getContext("2d")

                                context.imageSmoothingEnabled = false
                                context.font = "17px 'Pixel Font'"
                                context.textBaseline = "top"
                                context.textAlign = "left"
                                context.fillStyle = "#fff"

                                Canvas.loadImage(`https://mc-heads.net/avatar/${player}/100`).then(head => {
                                    context.drawImage(head, 2, 2, 22, 22)
                                    context.fillText(`${player} ${text}`, 32, 2)

                                    Util.sendMessage(channel, {
                                        files: [{
                                            attachment: image.toBuffer("image/png"),
                                            name: "playeraction.png"
                                        }]
                                    }).catch(console.error)
                                }).catch(error => {
                                    Util.sendMessage(channel, `[Failed to load image] ${player} ${text}`).catch(console.error)
                                })
                            }

                            current.forEach(player => {
                                if (old.filter(plr => (plr.id && player.id && plr.id == player.id) || plr.name.clean == player.name.clean).length == 0) {
                                    playerMessage(player.name.clean, "has joined the game.")
                                }
                            })

                            old.forEach(async (player) => {
                                if (current.filter(plr => (plr.id && player.id && plr.id == player.id) || plr.name.clean == player.name.clean).length == 0) {
                                    playerMessage(player.name.clean, "has left the game.")
                                }
                            })
                        }

                        server.players = current
                    }
                    
                } else {
                    let wasOnline = server.online
                    server.online = false
                    server.players = []
                    let error = data.error

                    if (["Failed to retrieve the status of the server within time", "Failed to query server within time"].includes(error.message) || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
                        if (wasOnline || server.start) {
                            if (["none", "online"].includes(server.statusMessage.type)) {
                                Util.sendMessage(channel, statusContents.offline).then(message => {
                                    server.statusMessage.message = message
                                    server.statusMessage.type = "offline"
                                }).catch(console.error)
                            }
                        }
                        return
                    } else if (error.code == "ENOTFOUND") {
                        let text = ":warning: Could not find server, check that a valid ip and port is set, and is the server running a supported version?"
                        Util.getRecentMessage(channel, text).then(message => {
                            if (!message) Util.sendMessage(channel, text).catch(console.error)
                        }).catch(console.error)
                        return
                    }
                    
                    let text = ":stop_sign: An error occured when trying to get server info"
                    Util.getRecentMessage(channel, text).then(message => {
                        if (!message) Util.sendMessage(channel, text).catch(console.error)
                    }).catch(console.error)

                    console.error(error)
                }
            }).catch(console.error).finally(() => {
                server.start = false

                client.servers[guild.id] = server
            })
        })
    }, intervalTime)
}


/**
 * Activity displays
 */
function activityDisplay() {
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

    client.activityIndex = 0;
    client.setInterval(() => {
        client.globalSettings.get("maintenance").then(async maintenance => {
            if (maintenance) {
                client.user.setPresence({
                    status: "dnd",
                    activity: {
                        name: "Maintenance mode",
                        type: "PLAYING"
                    }
                })
                return
            }

            let activity = activities[client.activityIndex]
            client.user.setPresence({
                status: "online",
                activity: {
                    name: typeof activity.text == "function" ? activity.text() : activity.text,
                    type: activity.type
                }
            })

            client.activityIndex++
            if (client.activityIndex == activities.length) client.activityIndex = 0;
        }).catch(console.error)
    }, 10000)
}


/**
 * Startup
 */
client.on("ready", () => {
    client.startTime = Date.now()

    client.globalSettings = new Settings.Global();
    console.log(`Loaded global settings`)

    client.settings = {}
    client.guilds.cache.forEach(guild => {
        client.settings[guild.id] = new Settings.Guild(guild);
    })
    console.log(`Loaded settings for ${Object.values(client.settings).length} guild(s)`)

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

    if (process.env.ISDEV != "TRUE") {
        function updateStats() {
            Util.requestAsync({
                hostname: "top.gg",
                path: "/api/bots/759415210628087841/stats",
                protocol: "HTTPS",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": process.env.TOPGGTOKEN
                },
                data: JSON.stringify({
                    server_count: client.guilds.cache.size
                })
            }).then(() => {
                console.log("Stats update sent to top.gg")
            }).catch(error => {
                console.error(error)
            })

            Util.requestAsync({
                hostname: "discordbotlist.com",
                path: "/api/v1/bots/759415210628087841/stats",
                protocol: "HTTPS",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": process.env.BOTLISTTOKEN
                },
                data: JSON.stringify({
                    guilds: client.guilds.cache.size
                })
            }).then(() => {
                console.log("Stats update sent to discordbotlist.com")
            }).catch(error => {
                console.error(error)
            })

            Util.requestAsync({
                hostname: "discord.bots.gg",
                path: "/api/v1/bots/759415210628087841/stats",
                protocol: "HTTPS",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": process.env.BOTSGGTOKEN
                },
                data: JSON.stringify({
                    guildCount: client.guilds.cache.size
                })
            }).then(() => {
                console.log("Stats update sent to discord.bots.gg")
            }).catch(error => {
                console.error(error)
            })
        }

        updateStats()
        client.setInterval(updateStats, 120*60*1000)
    }

    console.log("Bot started successfully")

    serverLogs()
    activityDisplay()
});


/**
 * Guild joining and leaving
 */
client.on("guildCreate", guild => {
    if (!client.settings) client.settings = [];
    client.settings[guild.id] = new Settings.Guild(guild);
})

client.on("guildDelete", guild => {
    if (process.env.ISDEV == "TRUE") return;

    if (client.settings) {
        let settings = client.settings[guild.id]
        settings.clear()

        client.settings[guild.id] = null;
    }
})


/**
 * Command Parser
 */
async function parseCommand(message) {
    const guild = message.guild
    const content = message.content

    const settings = client.settings[guild.id]
    const prefix = await settings.get("prefix")

    const isCommand = content.startsWith(prefix)
    let command, commandName, inputs

    if (isCommand) {
        [commandName, ...inputs] = content.trim().substring(prefix.length).split(" ");
        if (!commandName || commandName.length == 0) return;
    
        if (!client.commands) return console.error("Commands not loaded");

        command = client.commands.get(commandName.toLowerCase())
        if (!command) return Util.couldNotFind(message, "command", commandName);

        if (!command.private && await client.globalSettings.get("maintenance")) return Util.replyWarning(message, "Maintenance mode is currently enabled");

        message.command = command

        const disabledCommands = await settings.get("disabledCommands")
        if (disabledCommands.includes(command.name(true))) return Util.replyWarning(message, "That command is disabled in this server")

        const permissions = command.permissions()
        if (!Util.doesMemberHavePermission(message.member, permissions)) {
            return command.secret ? null : Util.replyWarning(message, "You don't have permission to do that")
        }

        if (inputs.length < command.numOfRequiredArguments()) {
            const helpCommand = client.commands.get("help")

            if (inputs.length == 0) {
                return command.secret ? null : helpCommand.commandHelp(message, command, prefix)
            } else {
                return command.secret ? null : Util.replyError(message, `'${commandName.toLowerCase()}' expects ${command.numOfRequiredArguments()} argument(s), got ${inputs.length}`);
            }
        }

        let argumentCount = Math.min(inputs.length, command.numOfArguments())
        let end = inputs.slice(argumentCount - 1).join(" ")
        inputs = inputs.slice(0, argumentCount - 1)
        inputs[argumentCount - 1] = end

        client.setImmediate(() => {
            Promise.resolve(command.execute(message, inputs)).catch(e => {
                Util.replyError(message, "An error occured while trying to execute that command, please report this to the developer!")
                console.error(e)
            })
        })
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
client.on("raw", packet => {
    let reactionEvents = [
        "MESSAGE_REACTION_ADD",
        "MESSAGE_REACTION_REMOVE",
        "MESSAGE_REACTION_REMOVE_ALL",
    ]

    if (reactionEvents.includes(packet.t)) {
        Util.getGuildById(client, packet.d.guild_id).then(guild => {
            const channel = Util.getChannelById(guild, packet.d.channel_id)

            if (channel.messages.cache.has(packet.d.message_id)) return;

            channel.messages.fetch(packet.d.message_id).then(async message => {
                if (packet.t === "MESSAGE_REACTION_REMOVE_ALL") {
                    client.emit("messageReactionRemoveAll", message);
                    return
                }
                
                const emoji = packet.d.emoji.id ? packet.d.emoji.id : packet.d.emoji.name
                const reaction = message.reactions.cache.get(emoji)
                client.users.fetch(packet.d.user_id).then(user => {
                    if (packet.t === "MESSAGE_REACTION_ADD") {
                        client.emit("messageReactionAdd", reaction, user);
                    }
                    if (packet.t === "MESSAGE_REACTION_REMOVE") {
                        client.emit("messageReactionRemove", reaction, user);
                    }
                }).catch(console.error)
            }).catch(console.error)
        }).catch(console.error)
    }
});


/**
 * Login
 */
client.login(process.env.TOKEN);