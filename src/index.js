const Canvas = require("canvas")
const OSUtils = require("node-os-utils")
const DonateAPI = require("donatebot-node-api")
const { HypixelAPI } = require("hypixel-api-v2")

const Mongoose = require("mongoose")
const Discord = require("discord.js")
const NodeCache = require("node-cache")
const Heroku = require('heroku-client')

const Util = require("./utils/util.js")
const Settings = require("./utils/settings.js")
const Protocol = require("./utils/protocol.js")

/**
 * Startup
 */
require("dotenv").config()
OSUtils.options.INTERVAL = 2000
Canvas.registerFont("./assets/botfont.ttf", {family: "Pixel Font"})

const client = new Discord.Client({
    messageCacheMaxSize: 50,
    messageCacheLifetime: 60*60,
    messageSweepInterval: 60*10,
    messageEditHistoryMaxSize: 1,
    presence: {
        status: "idle",
        activity: {
            name: "Starting...",
            type: "PLAYING"
        }
    }
});

client.hypixel = new HypixelAPI(process.env.HYPIXELTOKEN)

client.globalSettings = client.globalSettings ? client.globalSettings : new Settings.Global();
console.log(`Loaded global settings`)

client.globalSettings.get("supportServer").then(id => {
    //console.log(id)
    client.donations = new DonateAPI({
        serverID: id,
        apiKey: process.env.DONATETOKEN
    })
})

if (process.env.HEROKUAPIKEY) {
    client.heroku = new Heroku({token: process.env.HEROKUAPIKEY})
}

Mongoose.connect(`mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@${process.env.DBCLUSTER}.${process.env.DBDOMAIN}.mongodb.net/data`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(connection => {
    client.db = connection
}).catch(e => {
    console.error(`Database[connection]: ${e.toString()};\n${e.method} at ${e.path}`)
})


const fs = require('fs');
const v8 = require('v8');

function createHeapSnapshot() {
  const snapshotStream = v8.getHeapSnapshot();
  const fileName = `${Date.now()}.heapsnapshot`;
  const fileStream = fs.createWriteStream(`${__dirname}/../heapsnapshots/${fileName}`);
  snapshotStream.pipe(fileStream);
  console.log(`New heapsnapshot created ${fileName}`)
}


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
        if (client.uptime >= restartTime) {
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
            client.servers[guild.id] = server

            if (server.ip != ip || server.port != port) {
                server.ip = ip;
                server.port = port;
                server.players = [];
                server.online = false;
                server.start = true;
            }

            if (!server.statusMessage.message || server.statusMessage.message.deleted) {
                await new Promise((resolve, reject) => {
                    let done = 0
                    statuses.forEach((status, index) => {
                        Util.getRecentMessage(channel, status.content).then(message => {
                            if (message) {
                                if (server.statusMessage.message && Util.isMessageMoreRecent(message, server.statusMessage.message)) {
                                    server.statusMessage.message = message
                                    server.statusMessage.type = status.type
                                } else if(!server.statusMessage.message) {
                                    server.statusMessage.message = message
                                    server.statusMessage.type = status.type
                                }
                            }

                            done++
                        }).catch(e => {
                            console.error(`Logging[getRecentMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
                        }).finally(() => {
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
                                }).catch(e => {
                                    console.error(`Logging[sendMessage:status]: ${e.toString()};\n${e.method} at ${e.path}`)
                                })
                            }
                        }
                    }

                    server.online = true

                    let old = server.players
                    let current = data.players.sample ? data.players.sample : []

                    if (!data.players.sample && data.players.online > 0) {
                        let text = ":warning: Server has too many players online to log activity"
                        Util.getRecentMessage(channel, text).then(message => {
                            if (!message) Util.sendMessage(channel, text).catch(e => {
                                console.error(`Logging[sendMessage:warning]: ${e.toString()};\n${e.method} at ${e.path}`)
                            })
                        }).catch(e => {
                            console.error(`Pages[removeReaction]: ${e.toString()};\n${e.method} at ${e.path}`)
                        })
                    } else if (server.start && !data.query) {
                        let text = ":warning: ``enable-query=true`` is required for join logs"
                        Util.getRecentMessage(channel, text).then(message => {
                            if (!message) Util.sendMessage(channel, text).catch(e => {
                                console.error(`Logging[sendMessage:warning]: ${e.toString()};\n${e.method} at ${e.path}`)
                            })
                        }).catch(e => {
                            console.error(`Pages[removeReaction]: ${e.toString()};\n${e.method} at ${e.path}`)
                        })
                    } else if (data.bedrock) {
                        let text = ":warning: Bedrock servers do not return all players online."
                        Util.getRecentMessage(channel, text).then(message => {
                            if (!message) Util.sendMessage(channel, text).catch(e => {
                                console.error(`Logging[sendMessage:warning]: ${e.toString()};\n${e.method} at ${e.path}`)
                            })
                        }).catch(e => {
                            console.error(`Pages[removeReaction]: ${e.toString()};\n${e.method} at ${e.path}`)
                        })
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
                                    }).catch(e => {
                                        console.error(`Logging[sendMessage:player]: ${e.toString()};\n${e.method} at ${e.path}`)
                                    })
                                }).catch(error => {
                                    Util.sendMessage(channel, `[Failed to load image] ${player} ${text}`).catch(e => {
                                        console.error(`Logging[sendMessage:player(failed)]: ${e.toString()};\n${e.method} at ${e.path}`)
                                    })
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
                                }).catch(e => {
                                    console.error(`Logging[sendMessage:status]: ${e.toString()};\n${e.method} at ${e.path}`)
                                })
                            }
                        }
                        return
                    } else if (error.code == "ENOTFOUND") {
                        let text = ":warning: Could not find server, check that a valid ip and port is set, and is the server running a supported version?"
                        Util.getRecentMessage(channel, text).then(message => {
                            if (!message) Util.sendMessage(channel, text).catch(e => {
                                console.error(`Logging[sendMessage:warning]: ${e.toString()};\n${e.method} at ${e.path}`)
                            })
                        }).catch(e => {
                            console.error(`Logging[getRecentMessage:warning]: ${e.toString()};\n${e.method} at ${e.path}`)
                        })
                        return
                    }
                    
                    let text = ":stop_sign: An error occured when trying to get server info"
                    Util.getRecentMessage(channel, text).then(message => {
                        if (!message) Util.sendMessage(channel, text).catch(e => {
                            console.error(`Logging[sendMessage:error]: ${e.toString()};\n${e.method} at ${e.path}`)
                        })
                    }).catch(e => {
                        console.error(`Logging[getRecentMessage:error]: ${e.toString()};\n${e.method} at ${e.path}`)
                    })

                    console.error(`Logging[error]: ${error.toString()};\n${error.method} at ${error.path}`)
                }
            }).catch(e => {
                console.error(`Logging[getInfo]: ${e.toString()};\n${e.method} at ${e.path}`)
            }).finally(() => {
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
            text: "for .help | a mention",
            type: "WATCHING"
        },
        {
            text: "in discord.gg/uqVp2XzUP8",
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
                }).catch(e => {
                    console.error(`Activity[setPresence]: ${e.toString()};\n${e.method} at ${e.path}`)
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
            }).catch(e => {
                console.error(`Activity[setPresence]: ${e.toString()};\n${e.method} at ${e.path}`)
            })

            client.activityIndex++
            if (client.activityIndex == activities.length) client.activityIndex = 0;
        }).catch(e => {
            console.error(`Activity[getSetting]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }, 15000)
}


/**
 * Update bot site stats
 */
function updateStats() {
    let users = 0
    client.guilds.cache.forEach(guild => {
        users += guild.memberCount
    })

    const apis = [
        {
            hostname: "top.gg",
            path: "/api/bots/759415210628087841/stats",
            token: process.env.TOPGGTOKEN,
            data: JSON.stringify({
                server_count: client.guilds.cache.size
            })
        },
        {
            hostname: "discordbotlist.com",
            path: "/api/v1/bots/759415210628087841/stats",
            token: process.env.BOTLISTTOKEN,
            data: JSON.stringify({
                guilds: client.guilds.cache.size,
                users: users
            })
        },
        {
            hostname: "discord.bots.gg",
            path: "/api/v1/bots/759415210628087841/stats",
            token: process.env.BOTSGGTOKEN,
            data: JSON.stringify({
                guildCount: client.guilds.cache.size
            })
        },
        {
            hostname: "botsfordiscord.com",
            path: "/api/bot/759415210628087841",
            token: process.env.BFDTOKEN,
            data: JSON.stringify({
                server_count: client.guilds.cache.size
            })
        },
    ]

    apis.forEach(api => {
        console.log("Stats sent to " + api.hostname)
        Util.requestAsync({
            hostname: api.hostname,
            path: api.path,
            protocol: "HTTPS",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": api.token
            },
            data: api.data
        }).then(() => {
            console.log("Stats updated on " + api.hostname)
        }).catch(error => {
            console.error(error)
        })
    })
}


/**
 * Votes for bot
 */
function updateVotes() {
    Util.requestAsync({
        hostname: "top.gg",
        path: "/api/bots/759415210628087841/votes",
        protocol: "HTTPS",
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": process.env.TOPGGTOKEN
        }
    }).then(response => {
        let data = JSON.parse(response)
        //console.log(data.length, data)
    }).catch(error => {
        console.error(error)
    })
}


/**
 * Startup
 */
client.on("ready", () => {
    //BE CAUTIOUS WHEN RUNNING OFF OF PRODUCTION
    if (process.env.ISDEV != "TRUE") {
        Settings.Guild.cleanup(client.guilds.cache)
    }

    client.settings = {}
    client.guilds.cache.forEach(guild => {
        client.settings[guild.id] = client.settings[guild.id] ? client.settings[guild.id] : new Settings.Guild(guild);
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

    updateVotes()
 
    if (process.env.ISDEV != "TRUE") {
        updateStats()
        client.setInterval(updateStats, 120*60*1000)
    }

    if (process.env.SNAPSHOTS == "TRUE") {
        createHeapSnapshot()
        client.setInterval(createHeapSnapshot, 60*60*1000)
    }

    console.log("Bot started successfully")

    serverLogs()
    activityDisplay()
});


/**
 * Watch for ratelimiting
 */
client.on("rateLimit", info => {
    //console.warn(info)
})


/**
 * Guild joining and leaving
 */
client.on("guildCreate", guild => {
    if (!client.settings) client.settings = [];
    client.settings[guild.id] = client.settings[guild.id] ? client.settings[guild.id] : new Settings.Guild(guild);
})

client.on("guildDelete", guild => {
    if (process.env.ISDEV == "TRUE") return;

    if (client.settings) {
        let settings = client.settings[guild.id]
        settings.clear()
        delete client.settings[guild.id];
    }
})

    
/**
 * Command Parser
 */
const commandUsageCache = new NodeCache({
    checkperiod: 300,
    useClones: false
});
const commandsWithinTimeout = 3;
const commandTimeoutTime = 15*1000;

async function parseCommand(message) {
    const guild = message.guild;
    const content = message.content;
    const author = message.author;

    const settings = client.settings[guild.id];
    const prefix = await settings.get("prefix");

    const mentionStrings = [`<@${client.user.id}>`, `<@!${client.user.id}>`]
    const botRole = await Util.getRole(guild, client.user.username)
    if (botRole) mentionStrings.push(`<@&${botRole.id}>`);
    let firstWord = content.trim().split(" ").shift()
    firstWord = firstWord.substring(0, firstWord.indexOf(">") + 1)
    const isMention = mentionStrings.includes(firstWord)

    const isPrefix = content.startsWith(prefix);
    let command, commandName, inputs;

    if (isPrefix || isMention) {
        let commandUsage
        if (commandUsageCache.has(author.id)) commandUsage = commandUsageCache.get(author.id);
        else {
            commandUsage = {lastCommand: Date.now(), consCommands: 0};
            commandUsageCache.set(author.id, commandUsage);
        }

        if (commandUsage.consCommands > commandsWithinTimeout && commandUsage.lastCommand + commandTimeoutTime > Date.now()) {
            return Util.sendMessage(message, {
                embed: {
                    title: "Running too many commands!",
                    description: `Please wait ${Math.round((commandTimeoutTime - (Date.now() - commandUsage.lastCommand)) / 1000)} seconds before running another command.`,
                    color: 12333616
                }
            })
        }

        if (commandUsage.lastCommand + commandTimeoutTime > Date.now()) {
            commandUsage.consCommands++;
        } else {
            commandUsage.consCommands = 0;
        }

        commandUsage.lastCommand = Date.now();
        commandUsageCache.ttl(author.id, commandTimeoutTime/1000);

        if (isMention && content.trim() == firstWord) {
            return Util.sendMessage(message, {
                embed: {
                    title: "Getting started",
                    description: `My **prefix** in this server is: **\`\`${prefix}\`\`**\n\nTo run a command you can do \`\`${prefix}<command>\`\` or \`\`@${client.user.username} <command>\`\`!\nIf you would like to view a list of all commands you can do:\n\`\`${prefix}help\`\` or \`\`@${client.user.username} help\`\`.`,
                    color: 5145560,
                    timestamp: Date.now(),
                    footer: Util.getFooter(client)
                }
            })
        }

        [commandName, ...inputs] = content.trim().substring(isPrefix ? prefix.length : firstWord.length + (content.trim().substr(firstWord.length, 1) == " " ? 1 : 0)).split(" ");
        if (!commandName || commandName.length == 0) return;
    
        if (!client.commands) return console.error("Commands not loaded");

        if (!Util.doesMemberHavePermissionsInChannel(guild.me, message.channel, ["SEND_MESSAGES"])) {
            return //Util.cannotSendMessages(author, message.channel);
        }

        command = client.commands.get(commandName.toLowerCase())
        if (!command) return //Util.couldNotFind(message, "command", commandName);

        if (!command.private && await client.globalSettings.get("maintenance")) return Util.replyWarning(message, "Maintenance mode is currently enabled");

        const disabledCommands = await settings.get("disabledCommands")
        if (disabledCommands.includes(command.name(true))) return Util.replyWarning(message, "That command is disabled in this server")

        const permissions = command.permissions()
        if (!Util.doesMemberHavePermission(message.member, permissions)) {
            return command.secret ? null : Util.replyWarning(message, "You don't have permission to do that")
        }

        if (inputs.length < command.numOfRequiredArguments()) {
            const helpCommand = client.commands.get("help")

            if (inputs.length == 0) {
                return command.secret ? null : helpCommand.commandHelp(message, command)
            } else {
                return command.secret ? null : Util.replyError(message, `'${commandName.toLowerCase()}' expects ${command.numOfRequiredArguments()} argument(s), got ${inputs.length}`);
            }
        }

        let argumentCount = command.numOfArguments()
        if (argumentCount == 0 || !command.arguments()[argumentCount - 1].multiple) {
            argumentCount = Math.min(inputs.length, argumentCount)
            let end = inputs.slice(argumentCount - 1).join(" ")
            inputs = inputs.slice(0, argumentCount - 1)
            inputs[argumentCount - 1] = end
        }

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

            if (!channel || !channel.viewable || channel.messages.cache.has(packet.d.message_id)) return;

            channel.messages.fetch(packet.d.message_id).then(async message => {
                if (packet.t === "MESSAGE_REACTION_REMOVE_ALL") {
                    client.emit("messageReactionRemoveAll", message);
                    return
                }
                
                const emoji = packet.d.emoji.id ? packet.d.emoji.id : packet.d.emoji.name
                const reaction = message.reactions.cache.get(emoji)
                if (!reaction) return;
                client.users.fetch(packet.d.user_id).then(user => {
                    if (packet.t === "MESSAGE_REACTION_ADD") {
                        client.emit("messageReactionAdd", reaction, user);
                    }
                    if (packet.t === "MESSAGE_REACTION_REMOVE") {
                        client.emit("messageReactionRemove", reaction, user);
                    }
                }).catch(e => {
                    console.error(`Raw[fetchUser]: ${e.toString()};\n${e.method} at ${e.path}`)
                })
            }).catch(e => {
                console.error(`Raw[fetchMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
            })
        }).catch(e => {
            console.error(`Raw[getGuild]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
});


/**
 * Login
 */
client.login(process.env.TOKEN);