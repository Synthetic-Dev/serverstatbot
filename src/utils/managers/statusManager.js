const Crypto = require("crypto")
const Canvas = require("canvas")

const Util = require("../util.js")
const Mojang = require("../mojang.js")
const Protocol = require("../protocol.js")
const LocaleManager = require("./localeManager.js")
const ImageManager = require("./imageManager.js")

const LocalSettings = require("../../localSettings.json")

const statusContents = {
    online: "STATUS_MESSAGE_ONLINE",
    offline: "STATUS_MESSAGE_OFFLINE",
    restart: "STATUS_MESSAGE_RESTART"
}

const statuses = [
    {
        contentId: statusContents.online,
        online: true
    },
    {
        contentId: statusContents.restart,
        online: true
    },
    {
        contentId: statusContents.offline,
        online: false
    }
]

const playerListCache = ImageManager.getManager("playerlists")
const motdCache = ImageManager.getManager("motds")
const faviconCache = ImageManager.getManager("favicons", 3600)

class StatusManager {
    constructor(client, guild) {
        this.client = client;
        this.guild = guild;

        this.settings = client.settings[guild.id]
        this.lang = LocaleManager.getLang(guild.preferredLocale)

        this.server = {
            ip: "0.0.0.0",
            port: 25565,
            queryPort: -1,
            players: [],
            online: false,
            start: true
        }

        this.statusMessage = {
            message: null,
            online: null
        }
    }

    playerMessage(player, textFormat) {
        let image = Canvas.createCanvas((16 + 21) * 13 + 26, 28)
        let context = image.getContext("2d")

        context.imageSmoothingEnabled = false
        context.font = "20px 'Minecraft'"
        context.textBaseline = "top"
        context.textAlign = "left"
        context.fillStyle = "#fff"

        Canvas.loadImage(`https://mc-heads.net/avatar/${player}/100`).then(head => {
            context.drawImage(head, 2, 2, 22, 22)
            let text = textFormat.format(player)
            context.fillText(text, 32, 2)

            Util.sendMessage(this.channel, {
                files: [{
                    attachment: image.toBuffer("image/png"),
                    name: "playeraction.png"
                }]
            }).catch(e => {
                console.error(`Logging[sendMessage:player]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
            })
        }).catch(error => {
            Util.sendMessage(this.channel, this.lang.STATUS_PLAYER_FAILEDIMAGE.format(text)).catch(e => {
                console.error(`Logging[sendMessage:player(failed)]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
            })
        })
    }

    async updateChannel() {
        let previousChannel = this.channel
        let previousType = this.channelType

        let statuschannel = await this.settings.get("statuschannel")
        this.channel = Util.getChannelById(this.guild.channels, statuschannel.ChannelId)
        this.channelType = statuschannel.Type

        this.hasChannel = !!this.channel
        this.channelChanged = (!previousChannel && this.channel) || (previousChannel && !this.channel) || (previousChannel && previousChannel.id != this.channel.id)
        if (this.hasChannel) {
            this.canSend = Util.hasPermissionsInChannel(this.guild.me, this.channel, ["SEND_MESSAGES"])
        }

        this.typeChanged = previousType != this.channelType
        return this.hasChannel
    }

    async logs(data) {
        if (data.online) {
            if ((!this.server.online && !this.statusMessage.online) || this.channelChanged) {
                if (!this.server.start && this.statusMessage.message && this.statusMessage.message.member == this.guild.me && Date.now() - this.statusMessage.message.createdTimestamp < 120*1000) {
                    this.statusMessage.message.edit("<:cyan_circle_with_circular_arrow:845041391247032350> " + this.lang[statusContents.restart]).catch(e => {
                        console.error(`Logging[editMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                    })
                } else if (!this.statusMessage.message) {
                    Util.sendMessage(this.channel, "<:green_circle_with_tick:818512512500105249> " + this.lang[statusContents.online]).then(message => {
                        this.settings.set("statuschannel", message.id, "MessageId")
                        this.statusMessage = {
                            message: message,
                            online: true
                        }
                        
                    }).catch(e => {
                        console.error(`Logging[sendMessage:status]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                    })
                }
            }

            this.statusMessage.online = true
            this.server.online = true

            let old = this.server.players
            let current = data.players.sample ?? []

            let warningText
            if (!data.players.sample && data.players.online > 0) {
                warningText = ":warning: " + this.lang.STATUS_MESSAGE_TOOMANYPLAYERS
            } else if (!data.query && this.server.start) {
                warningText = ":warning: " + this.lang.STATUS_MESSAGE_NOQUERY
            } else if (data.bedrock && this.server.start) {
                warningText = ":warning: " + this.lang.SERVER_BEDROCK
            } 

            if (warningText) {
                Util.getRecentMessage(this.channel, warningText).then(message => {
                    if (message) return;
                    Util.sendMessage(this.channel, warningText).catch(e => {
                        console.error(`Logging[sendMessage:warning]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                    })
                }).catch(e => {
                    console.error(`Logging[getRecentMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                })
                return
            }

            if (!data.query || current.length != data.players.online) return;
            if (!this.server.start) {
                current.forEach(player => {
                    if (old.filter(plr => (plr.id && player.id && plr.id == player.id) || plr.name.clean == player.name.clean).length == 0) {
                        this.playerMessage(player.name.clean, this.lang.STATUS_PLAYER_JOINED)
                    }
                })

                old.forEach(async (player) => {
                    if (current.filter(plr => (plr.id && player.id && plr.id == player.id) || plr.name.clean == player.name.clean).length == 0) {
                        this.playerMessage(player.name.clean, this.lang.STATUS_PLAYER_LEFT)
                    }
                })
            }

            this.server.players = current
            return
        }

        let wasOnline = this.server.online
        this.server.online = false
        this.server.players = []

        let error = data.error
        let errorText
        let callback = () => {}
        switch(Protocol.getErrorType(error)) {
            case "offline":
                if (((wasOnline || this.server.start) && (this.statusMessage.online == null || this.statusMessage.online == true)) || this.channelChanged) {
                    errorText = "<:red_circle_with_cross:818512512764084265> " + this.lang[statusContents.offline]
                    callback = message => {
                        this.settings.set("statuschannel", message.id, "MessageId")
                        this.statusMessage = {
                            message: message,
                            online: false
                        }
                    }
                }
                break
            case "notfound": errorText = ":warning: " + this.lang.SERVER_COULDNOTFIND; break;
            case "badport": errorText = ":warning: " + this.lang.SERVER_WRONGPORT; break;
            case "blocked": errorText = ":warning: " + this.lang.SERVER_BLOCKED; break;
            default:
                errorText = this.lang.STATUS_MESSAGE_ERROR
                console.error(`Logging[error]: ${error.toString()};\n${error.method} at ${error.path}`)
        }

        if (errorText) {
            Util.getRecentMessage(this.channel, errorText).then(message => {
                if (message) return;
                Util.sendMessage(this.channel, errorText).then(callback).catch(e => {
                    console.error(`Logging[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                })
            }).catch(e => {
                console.error(`Logging[getRecentMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
            })
        }
    }

    updateMessage(content, online) {
        let promise
        if (this.statusMessage.message && !this.statusMessage.message.deleted) {
            promise = this.statusMessage.message.edit(content)
        } else {
            promise = Util.sendMessage(this.channel, content)
        }
        
        promise.then(message => {
            this.settings.set("statuschannel", message.id, "MessageId")
            this.statusMessage = {
                message: message,
                online: online
            }
        }).catch(e => {
            console.error(`Logging[updateMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }

    async _panel(data, imageMethod) {
        if (data.online) {
            let fields = [
                {
                    name: this.lang.COMMAND_STATUS_FIELD1,
                    value: data.version.minecraft ?? this.lang.NOT_PROVIDED
                },
                {
                    name: this.lang.COMMAND_STATUS_FIELD2,
                    value: (data.bedrock ? this.lang.BEDROCK : (data.modded ? this.lang.MODS.format(data.mods.modList.length) : this.lang.VANILLA)) + (data.plugins && data.plugins.length > 0 ? " " + this.lang.PLUGINS.format(data.plugins.length).trim() : "")
                }
            ]

            if (data.levelName) {
                fields.unshift({
                    name: this.lang.COMMAND_STATUS_FIELD3,
                    value: data.levelName
                })
            }

            let content = {
                content: "",
                embed: {
                    title: `[${this.lang.AUTOMATED}] ` + this.lang.COMMAND_STATUS_TITLE.format(data.bedrock ? `(${this.lang.BEDROCK})` : `(${this.lang.JAVA})`),
                    description: this.lang.COMMAND_STATUS_DESC.format(
                        this.server.ip + ([19132, 25565].includes(this.server.port) ? "" : `:${this.server.port}`),
                        data.latency > 0 ? `\nLatency: **${data.latency}ms**` : "",
                        data.players.online, data.players.max,
                        data.gameMode ? `\nGamemode: **${data.gameMode}**` : (data.gameType ? `\nGametype: **${data.gameType}**` : ""),
                        data.serverID ? `\nSeed: \`\`${data.serverID}\`\`` : ""
                    ),
                    color: 3092790,
                    fields: fields,
                    timestamp: Date.now()
                }
            }

            const botGuild = await Util.getGuildById(this.client, LocalSettings.botserver.id)

            if (imageMethod) {
                await Promise.resolve(imageMethod(botGuild, content))
            }

            let faviconLink
            const faviconChannel = botGuild ? Util.getChannelById(botGuild.channels, LocalSettings.botserver.channels.favicons) : null
            if (faviconChannel && data.favicon) {
                let hash = Crypto.createHash("md5")
                hash.update(data.favicon)
                const faviconKey = hash.digest("hex")

                faviconLink = faviconCache.get(faviconKey)
                if (faviconLink) {
                    faviconCache.ttl(faviconKey, 3600)
                    content.embed.thumbnail = {
                        url: faviconLink
                    }
                    return this.updateMessage(content, true)
                }

                let image = Canvas.createCanvas(64, 64)
                let context = image.getContext("2d")
                context.imageSmoothingEnabled = false

                let favicon = new Canvas.Image()
                favicon.onload = async () => {
                    context.drawImage(favicon, 0, 0, 64, 64)

                    let promise = Util.sendMessage(faviconChannel, {
                        files: [
                            {
                                attachment: image.toBuffer("image/png"),
                                name: `favicon-${this.guild.id}-${Date.now()}.png`
                            }
                        ]
                    })
                    try {
                        let message = await promise
                        let image = message.attachments.first()
                        if (image) {
                            faviconLink = image.url
                            faviconCache.set(faviconKey, faviconLink)
                        }
                    } catch (e) {}

                    if (faviconLink) {
                        content.embed.thumbnail = {
                            url: faviconLink
                        }
                    }

                    this.updateMessage(content, true)
                }
                favicon.onerror = () => {
                    this.updateMessage(content, true)
                }
                
                favicon.src = data.favicon
            } else {
                if (data.bedrock) faviconLink = LocalSettings.images.textures.bedrock;
                else faviconLink = LocalSettings.images.textures.grass;

                content.embed.thumbnail = {
                    url: faviconLink
                }

                this.updateMessage(content, true)
            }
            return this.updateMessage(content, true)
        }

        let wasOnline = this.server.online
        this.server.online = false
        this.server.players = []

        let error = data.error
        let errorText
        switch(Protocol.getErrorType(error)) {
            case "offline":
                if (((wasOnline || this.server.start) && (this.statusMessage.online == null || this.statusMessage.online == true)) || this.channelChanged) {
                    errorText = "<:red_circle_with_cross:818512512764084265> " + this.lang[statusContents.offline]
                }
                break
            case "notfound": errorText = ":warning: " + this.lang.SERVER_COULDNOTFIND; break;
            case "badport": errorText = ":warning: " + this.lang.SERVER_WRONGPORT; break;
            case "blocked": errorText = ":warning: " + this.lang.SERVER_BLOCKED; break;
            default:
                errorText = this.lang.STATUS_MESSAGE_ERROR
                console.error(`Logging[error]: ${error.toString()};\n${error.method} at ${error.path}`)
        }

        if (errorText) {
            const content = {
                content: "",
                embed: {
                    title: `[${this.lang.AUTOMATED}] ` + this.lang.COMMAND_STATUS_TITLE.format("").trim(),
                    description: this.lang.COMMAND_STATUS_FAIL_DESC.format(
                        this.server.ip, this.server.port,
                        "\n\n" + errorText
                    ),
                    color: 12333616,
                    timestamp: Date.now()
                }
            }

            this.updateMessage(content, false)
        }
        return
    }

    async panel(data) {
        this._panel(data, async (botGuild, content) => {
            let hash = Crypto.createHash("md5")
            hash.update(data.motd.raw)
            const motdKey = hash.digest("hex")

            let motdLink = motdCache.get(motdKey)
            if (motdLink) {
                motdCache.ttl(motdKey, 600)
            } else {
                let motd = Mojang.generateMOTD(data.motd.raw, 4, 10)
                const motdChannel = botGuild ? Util.getChannelById(botGuild.channels, LocalSettings.botserver.channels.motds) : null

                if (motdChannel) {
                    let promise = Util.sendMessage(motdChannel, {
                        files: [
                            {
                                attachment: motd.toBuffer("image/png"),
                                name: `motd-${this.guild.id}-${Date.now()}.png`
                            }
                        ]
                    })
                    try {
                        let message = await promise
                        let image = message.attachments.first()
                        if (image) {
                            motdLink = image.url
                            motdCache.set(motdKey, motdLink)
                        }
                    } catch (e) {}
                }
            }
            
            if (motdLink) {
                content.embed.image = {
                    url: motdLink
                }
            }
        })
    }

    async panel_players(data) {
        this._panel(data, async (botGuild, content) => {
            if (data.players.online == 0 || !data.players.sample || data.players.sample.length == 0) return;

            let hash = Crypto.createHash("md5")
            data.players.sample.forEach(player => {
                hash.update(player.name.clean)
            })
            const playerListKey = hash.digest("hex")

            let playerListLink = playerListCache.get(playerListKey)
            if (playerListLink) {
                playerListCache.ttl(playerListKey, 600)
            } else {
                let image = await Mojang.generatePlayerList(data.players.sample, this.lang, 20, 4, 256)
                const playerListChannel = botGuild ? Util.getChannelById(botGuild.channels, LocalSettings.botserver.channels.playerlists) : null

                if (playerListChannel) {
                    let promise = Util.sendMessage(playerListChannel, {
                        files: [
                            {
                                attachment: image.toBuffer("image/png"),
                                name: `playerlist-${this.guild.id}-${Date.now()}.png`
                            }
                        ]
                    })
                    try {
                        let message = await promise
                        let image = message.attachments.first()
                        if (image) {
                            playerListLink = image.url
                            playerListCache.set(playerListKey, playerListLink)
                        }
                    } catch (e) {}
                }
            }
            
            if (playerListLink) {
                content.embed.image = {
                    url: playerListLink
                }
            }

            let warningText
            if (!data.players.sample && data.players.online > 0) {
                warningText = this.lang.STATUS_MESSAGE_TOOMANYPLAYERS
            } else if (!data.query && this.server.start) {
                warningText = this.lang.STATUS_MESSAGE_NOQUERY
            } else if (data.bedrock && this.server.start) {
                warningText = this.lang.SERVER_BEDROCK
            }

            if (warningText) {
                content.embed.fields.push({
                    name: ":warning:",
                    value: warningText
                })
            }
        })
    }

    async update(startup = false) {
        await this.updateChannel()
        if (!this.hasChannel) return;

        this.lang = LocaleManager.getLang(this.guild.preferredLocale)

        if (!this.canSend) {
            this.settings.set("statuschannel", "0", "ChannelId")
            let priorityChannel = Util.getPriorityChannel(this.guild, chl => Util.hasPermissionsInChannel(this.guild.me, chl, ["SEND_MESSAGES"]))
            if (priorityChannel) {
                Util.sendError(priorityChannel, this.lang.STATUS_CHANNEL_NOPERMS)
            } else {
                console.log(`[Logging] Did not have permissions to send messages in (${this.guild.id}) ${this.guild.name}'s status channel and could not find/send message in priority channel.`)
            }
            return
        };
        
        const serverData = await this.settings.get("server")
        const newServer = {
            ip: serverData.Ip,
            port: serverData.Port,
            queryPort: serverData.QueryPort
        }

        let dataChanged = false;
        Object.keys(newServer).forEach(key => {
            if (newServer[key] != this.server[key]) dataChanged = true;
        })

        if (dataChanged || this.typeChanged) {
            this.server = {
                ip: serverData.Ip,
                port: serverData.Port,
                queryPort: serverData.QueryPort,
                players: [],
                online: false,
                start: true
            }
        }

        if (!this.statusMessage.message || this.statusMessage.message.deleted) {
            await new Promise(async resolve => {
                let messageId = await this.settings.get("statuschannel", "MessageId")
                Util.getMessageInChannel(this.channel, messageId).then(message => {
                    this.statusMessage = {
                        message: message.author.id == this.client.user.id ? message : null,
                        online: null
                    }
                    resolve()
                }).catch(e => {
                    if (this.channelType != 0) resolve();

                    let done = 0
                    statuses.forEach(status => {
                        Util.getRecentMessageContaining(this.channel, this.lang[status.contentId]).then(message => {
                            done++
                            if (!message) return;
                            if (!this.statusMessage.message || (this.statusMessage.message && Util.isMessageMoreRecent(message, this.statusMessage.message))) {
                                this.statusMessage = {
                                    message: message.author.id == this.client.user.id ? message : null,
                                    online: status.online
                                }
                            } 
                        }).catch(e => {
                            console.error(`Logging[getRecentMessageContaining]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                        }).finally(() => {
                            if (done == statuses.length) resolve();
                        })
                    })
                })
            })
        }

        let displayMethod = () => {}
        switch(this.channelType) {
            case 0:
                displayMethod = this.logs
                break
            case 2:
                displayMethod = this.panel
                break
            case 3:
                displayMethod = this.panel_players
                break
        }

        Protocol.getInfo(this.server.ip, this.server.port, this.server.queryPort).then(async data => {
            displayMethod.call(this, data)
        }).catch(e => {
            console.error(`Logging[getInfo]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        }).finally(() => {
            this.server.start = false
        })
    }
}

module.exports = StatusManager