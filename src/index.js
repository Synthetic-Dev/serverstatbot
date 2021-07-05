const Canvas = require("canvas")
const OSUtils = require("node-os-utils")
const DonateAPI = require("donatebot-node-api")
const { HypixelAPI } = require("hypixel-api-v2")

const Mongoose = require("mongoose")
const Discord = require("discord.js")
const DiscordButtons = require("discord-buttons")
const Heroku = require("heroku-client")

const Util = require("./utils/Util")
const Settings = require("./utils/Settings")
const LocaleManager = require("./classes/LocaleManager")
const StatusManager = require("./classes/StatusManager")

const CommandExecutor = require("./classes/CommandExecutor")
const CommandParser = require("./classes/CommandParser")

const LocalSettings = require("./localSettings.json")

/**
 * Startup
 */
require("dotenv").config()
OSUtils.options.INTERVAL = 2000

Canvas.registerFont("./assets/fonts/MinecraftRegular.otf", {
    family: "Minecraft",
    weight: "normal",
    style: "normal",
})
Canvas.registerFont("./assets/fonts/MinecraftBold.otf", {
    family: "Minecraft",
    weight: "bold",
    style: "normal",
})
Canvas.registerFont("./assets/fonts/MinecraftItalic.otf", {
    family: "Minecraft",
    weight: "normal",
    style: "italic",
})
Canvas.registerFont("./assets/fonts/MinecraftBoldItalic.otf", {
    family: "Minecraft",
    weight: "bold",
    style: "italic",
})

const client = new Discord.Client({
    messageCacheMaxSize: 30,
    messageCacheLifetime: 60 * 60,
    messageSweepInterval: 60 * 10,
    messageEditHistoryMaxSize: 1,
    presence: {
        status: "idle",
        activity: {
            name: "startup...",
            type: "PLAYING",
        },
    },
})

DiscordButtons(client)

const executor = new CommandExecutor(client)
const parser = new CommandParser(client, executor)
client.hypixel = new HypixelAPI(process.env.HYPIXELTOKEN)

client.globalSettings = client.globalSettings ?? new Settings.Global()
console.log(`[Setup] Loaded global settings`)

client.donations = new DonateAPI({
    serverID: LocalSettings.botserver.id,
    apiKey: process.env.DONATETOKEN,
})

if (process.env.HEROKUAPIKEY) {
    client.heroku = new Heroku({ token: process.env.HEROKUAPIKEY })
}

Mongoose.connect(
    `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@${process.env.DBCLUSTER}.${process.env.DBDOMAIN}.mongodb.net/data`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
)
    .then((connection) => {
        client.db = connection
    })
    .catch((e) => {
        Util.error(e, "Database", "connection")
    })

const fs = require("fs")
const v8 = require("v8")

function createHeapSnapshot() {
    const snapshotStream = v8.getHeapSnapshot()
    const fileName = `${Date.now()}.heapsnapshot`
    const fileStream = fs.createWriteStream(
        `${__dirname}/../heapsnapshots/${fileName}`
    )
    snapshotStream.pipe(fileStream)
    console.log(`New heapsnapshot created ${fileName}`)
}

/**
 * Activity displays
 */
function activityDisplay() {
    const activities = [
        {
            text: "for .help | a mention",
            type: "WATCHING",
        },
        {
            text: "in discord.gg/uqVp2XzUP8",
            type: "PLAYING",
        },
        {
            text: () => {
                return `${client.guilds.cache.size} servers`
            },
            type: "WATCHING",
        },
    ]

    client.activityIndex = 0
    client.setInterval(() => {
        client.globalSettings
            .get("Maintenance")
            .then(async (value) => {
                if (value) {
                    client.user
                        .setPresence({
                            status: "dnd",
                            activity: {
                                name: "Maintenance mode",
                                type: "PLAYING",
                            },
                        })
                        .catch((e) => {
                            Util.error(e, "Activity", "setPresence1")
                        })
                    return
                }

                let activity = activities[client.activityIndex]
                client.user
                    .setPresence({
                        status: "online",
                        activity: {
                            name:
                                typeof activity.text == "function"
                                    ? activity.text()
                                    : activity.text,
                            type: activity.type,
                        },
                    })
                    .catch((e) => {
                        Util.error(e, "Activity", "setPresence2")
                    })

                client.activityIndex++
                if (client.activityIndex == activities.length)
                    client.activityIndex = 0
            })
            .catch((e) => {
                Util.error(e, "Activity", "getSetting")
            })
    }, 15000)
}

/**
 * Update bot site stats
 */
function updateStats() {
    let users = 0
    client.guilds.cache.forEach((guild) => {
        users += guild.memberCount
    })
    let servers = client.guilds.cache.size
    let shards = 1

    LocalSettings.botsites.forEach((site) => {
        console.log("[Web] Stats sent to " + site.hostname)

        let data = {}
        if (site.api.countkey) data[site.api.countkey] = servers
        if (site.api.userskey) data[site.api.userskey] = users
        if (site.api.shardkey) data[site.api.shardkey] = shards

        if (Object.keys(data).length == 0) return

        Util.requestAsync({
            hostname: site.api.hostname ?? site.hostname,
            path: site.api.path,
            protocol: "HTTPS",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: process.env[site.api.token],
            },
            data: JSON.stringify(data),
        })
            .then(() => {
                console.log("[Web] Stats updated on " + site.hostname)
            })
            .catch((error) => {
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
            Authorization: process.env.TOPGGTOKEN,
        },
    })
        .then((response) => {
            console.log(response)
        })
        .catch((error) => {
            console.error(error)
        })
}

/**
 * Startup
 */
client.once("ready", () => {
    //BE CAUTIOUS WHEN RUNNING OFF OF PRODUCTION
    /*
    if (process.env.ISDEV != "TRUE") {
        Settings.Guild.cleanup(client.guilds.cache)
    }
    */

    client.settings = {}
    client.loggers = []
    client.guilds.cache.forEach((guild) => {
        client.settings[guild.id] =
            client.settings[guild.id] ?? new Settings.Guild(guild)
        client.loggers[guild.id] =
            client.loggers[guild.id] ?? new StatusManager(client, guild)
    })
    console.log(
        `[Setup] Loaded settings for ${
            Object.values(client.settings).length
        } guild(s)`
    )
    console.log(
        `[Setup] Loaded loggers for ${
            Object.values(client.loggers).length
        } guild(s)`
    )

    client.commandsProcessed = 0
    client.lastCommandTime = null
    client.commands = Util.loadmodules("commands", (command, commands) => {
        command = new command(client)
        commands.set(command.name, command)

        let aliases = command.aliases ? command.aliases() : null
        if (aliases) {
            for (let alias of aliases) {
                commands.set(alias.toLowerCase(), command)
            }
        }
    })

    console.log("[Setup] Bot started successfully")
    console.log("[Setup] Starting intervals...")

    if (process.env.ISDEV != "TRUE") {
        //updateVotes()

        updateStats()
        client.setInterval(updateStats, 120 * 60 * 1000)
    }

    if (process.env.SNAPSHOTS == "TRUE") {
        createHeapSnapshot()
        client.setInterval(createHeapSnapshot, 60 * 60 * 1000)
    }

    let startup = true
    if (process.env.NOUPDATE != "TRUE") {
        const updateLoggers = () => {
            client.guilds.cache.forEach((guild) => {
                const logger = client.loggers[guild.id]
                if (!logger) return

                logger.update(startup)
            })
        }

        updateLoggers()
        client.setInterval(async () => {
            if (await client.globalSettings.get("Maintenance")) return
            updateLoggers()
            startup = false
        }, 60 * 1000)
    }

    client.countCaptureMax = 86400 * 7000
    client.countCaptureEvery = 21600 * 1000

    client.memoryCaptureMax = 3600 * 3000
    client.memoryCaptureEvery = 180 * 1000
    client.memoryLog = [
        {
            x: Date.now(),
            y: process.memoryUsage().rss,
        },
    ]

    client.setInterval(async () => {
        if (await client.globalSettings.get("Maintenance")) return
        client.globalSettings.update("ServerCountLog", (log) => {
            while ((record = log[0])) {
                if (record.x < Date.now() - client.countCaptureMax) {
                    log.shift()
                } else break
            }

            let recent = log[log.length - 1]
            if (!recent || recent.x + client.countCaptureEvery < Date.now()) {
                log.push({
                    x: Date.now(),
                    y: client.guilds.cache.size,
                })
            }
            return log
        })

        while ((record = client.memoryLog[0])) {
            if (record.x < Date.now() - client.memoryCaptureMax) {
                client.memoryLog.shift()
            } else break
        }

        let recent = client.memoryLog[client.memoryLog.length - 1]
        if (!recent || recent.x + client.memoryCaptureEvery < Date.now()) {
            client.memoryLog.push({
                x: Date.now(),
                y: process.memoryUsage().rss,
            })
        }
    }, 120 * 1000)

    activityDisplay()
})

/**
 * Guild joining and leaving
 */
client.on("guildCreate", async (guild) => {
    if (!client.settings) client.settings = []
    const lang = LocaleManager.getLang(guild.preferredLocale)
    const settings = client.settings[guild.id] ?? new Settings.Guild(guild)
    settings.clear()

    client.settings[guild.id] = settings
    console.log(`[${guild.id}] Added to guild ${guild.name}`)

    let priorityChannel = Util.getPriorityChannel(guild, (chl) =>
        Util.hasPermissionsInChannel(guild.me, chl, ["SEND_MESSAGES"])
    )
    if (priorityChannel) {
        const prefix = await settings.get("prefix", "Prefix")
        const welcomeComand = client.commands.get("welcome")
        welcomeComand.sendWelcome(client, priorityChannel, lang, prefix)
    }
})

client.on("guildDelete", (guild) => {
    console.log(`[${guild.id}] Removed from guild ${guild.name}`)

    if (client.settings) {
        let settings = client.settings[guild.id]
        settings.clear()
        delete client.settings[guild.id]
    }
})

/**
 * Message handling
 */
client.on("message", async (message) => {
    client.ping = Math.abs(Date.now() - message.createdTimestamp)
    if (message.author.bot || message.author.system) return

    if (!message.guild) {
        return Util.replyWarning(
            message,
            "Commands can only be used in a server that I am in"
        )
    }

    parser.parse(message)
})

/**
 * Raw event emitter
 */
client.on("raw", (packet) => {
    let reactionEvents = [
        "MESSAGE_REACTION_ADD",
        "MESSAGE_REACTION_REMOVE",
        "MESSAGE_REACTION_REMOVE_ALL",
    ]

    if (reactionEvents.includes(packet.t)) {
        Util.getGuildById(client, packet.d.guild_id)
            .then((guild) => {
                const channel = Util.getChannelById(
                    guild.channels,
                    packet.d.channel_id
                )

                if (
                    !channel ||
                    !channel.viewable ||
                    channel.messages.cache.has(packet.d.message_id)
                )
                    return
                if (
                    !Util.hasPermissionsInChannel(guild.me, channel, [
                        "VIEW_CHANNEL",
                        "READ_MESSAGE_HISTORY",
                    ])
                )
                    channel.messages
                        .fetch(packet.d.message_id)
                        .then(async (message) => {
                            if (packet.t === "MESSAGE_REACTION_REMOVE_ALL") {
                                client.emit("messageReactionRemoveAll", message)
                                return
                            }

                            const emoji =
                                packet.d.emoji.id ?? packet.d.emoji.name
                            const reaction = message.reactions.cache.get(emoji)
                            if (!reaction) return
                            client.users
                                .fetch(packet.d.user_id)
                                .then((user) => {
                                    if (packet.t === "MESSAGE_REACTION_ADD") {
                                        client.emit(
                                            "messageReactionAdd",
                                            reaction,
                                            user
                                        )
                                    }
                                    if (
                                        packet.t === "MESSAGE_REACTION_REMOVE"
                                    ) {
                                        client.emit(
                                            "messageReactionRemove",
                                            reaction,
                                            user
                                        )
                                    }
                                })
                                .catch((e) => {
                                    Util.error(e, "Raw", "fetchUser")
                                })
                        })
                        .catch((e) => {
                            Util.error(e, "Raw", "fetchMessage")
                        })
            })
            .catch((e) => {
                Util.error(e, "Raw", "getGuild")
            })
    }
})

/*process.on("uncaughtException", err => {
    console.error("[UncaughtException Error] " + err)
})*/

/**
 * Login
 */
client.login(process.env.TOKEN)
