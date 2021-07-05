const Canvas = require("canvas")
const Discord = require("discord.js")
const OSUtils = require("node-os-utils")
const { getAverageColor } = require("fast-average-color-node")

const Util = require("../utils/Util")
const Mojang = require("../utils/Mojang")
const ImageManager = require("../classes/ImageManager")

const CommandBase = require("../classes/CommandBase")

const LocalSettings = require("../localSettings.json")

const graphCache = ImageManager.getManager("graphs", 3600)
const statsCache = ImageManager.getManager("botstats", 1200)

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "stats",
            descId: "COMMAND_STATS",
            args: [
                {
                    name: "type",
                    descId: "COMMAND_STATS_ARG1",
                },
                {
                    name: "",
                    optional: true,
                    multiple: true,
                },
            ],
            optionTree: {
                bot: true,
                hypixel: {
                    players: {
                        _optional: true,
                        gamemode: false,
                    },
                    player: {
                        username: false,
                    },
                    compare: {
                        username: {
                            _value: false,
                            username: false,
                        },
                    },
                    leaderboard: {
                        gamemode: false,
                    },
                },
            },
            tags: ["CAN_DISABLE"],
        })

        this.setOptionFunc("bot", this.botStats)
        this.setOptionFunc("hypixel.players", this.hypixelStats_players, true)
        this.setOptionFunc("hypixel.players", this.hypixelStats_players)
        this.setOptionFunc("hypixel.player", this.hypixelStats_player)
        this.setOptionFunc("hypixel.compare", this.hypixelStats_playerCompare)
        this.setOptionFunc("hypixel.leaderboard", this.hypixelStats_leaderboard)
    }

    hypixelStats_players(options, input, depth) {
        Util.startTyping(options.message).catch((e) => {
            Util.error(e, "Stats", "startTyping1")
        })
        this.client.hypixel.counts().then((counts) => {
            Util.stopTyping(options.message)
            let pages = []

            if (depth > 1) {
                const embed = new Discord.MessageEmbed()
                    .setTitle(
                        options.lang.COMMAND_STATS_HYPIXEL_PLAYERS_FAIL_TITLE
                    )
                    .setDescription(
                        options.lang.COMMAND_STATS_HYPIXEL_PLAYERS_FAIL_DESC
                    )
                    .setColor(12333616)
                    .setAuthor(
                        "Hypixel",
                        "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                    )
                    .setTimestamp()

                let currentPage = { embed: embed }
                pages.push(currentPage)

                Object.keys(counts.games).forEach((gamemode) => {
                    if (gamemode.toLowerCase().replace("_", "") != input) return
                    let data = counts.games[gamemode]

                    gamemode = gamemode.replace(/_/g, " ").toTitleCase(true)

                    currentPage.embed.setTitle(
                        options.lang.COMMAND_STATS_HYPIXEL_PLAYERS_TITLE.format(
                            gamemode
                        )
                    )
                    currentPage.embed.setColor(5145560)

                    let desc = options.lang.SERVER_PLAYERS_SGL.format(
                        data.players
                    )

                    if (data.modes) {
                        let modes = []
                        Object.keys(data.modes).forEach((mode) => {
                            let count = data.modes[mode]
                            if (count == 0) return

                            mode = mode.replace(/_/g, " ").toTitleCase(true)
                            modes.push(`• ${mode}: **${count}**`)
                        })

                        desc += `\n${modes.join("\n").trim()}`
                    }

                    currentPage.embed.setDescription(desc)
                })
            } else {
                const embed = new Discord.MessageEmbed()
                    .setTitle(
                        options.lang.COMMAND_STATS_HYPIXEL_PLAYERS_TITLE.format(
                            ""
                        ).trim()
                    )
                    .setDescription(
                        options.lang.SERVER_PLAYERS_SGL.format(
                            counts.playerCount
                        )
                    )
                    .setColor(5145560)
                    .setAuthor(
                        "Hypixel",
                        "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                    )
                    .setTimestamp()

                let currentPage = { embed: embed }
                pages.push(currentPage)

                Object.keys(counts.games).forEach((gamemode) => {
                    let data = counts.games[gamemode]

                    gamemode = gamemode.replace(/_/g, " ").toTitleCase(true)

                    let field = {
                        name: gamemode,
                        value:
                            data.players > 0
                                ? options.lang.SERVER_PLAYERS_REV.format(
                                      data.players
                                  )
                                : options.lang.EMPTY,
                        inline: true,
                    }
                    if (data.modes) {
                        let modes = []
                        const maxModes = 3
                        Object.keys(data.modes).forEach((mode) => {
                            let count = data.modes[mode]
                            if (count == 0) return
                            if (modes.length >= maxModes) {
                                if (modes.length == maxModes) {
                                    modes.push(
                                        options.lang.AND_MORE.format(
                                            Object.keys(data.modes).length -
                                                maxModes
                                        )
                                    )
                                }
                                return
                            }

                            mode = mode.replace(/_/g, " ").toTitleCase(true)
                            modes.push(
                                `• ${mode}: **${count}/${data.players}**`
                            )
                        })
                        field.value = `${modes.join("\n").trim()}\n`
                    }

                    if (currentPage.embed.fields.length >= 9) {
                        const embed = new Discord.MessageEmbed()
                            .setTitle(
                                options.lang.COMMAND_STATS_HYPIXEL_PLAYERS_TITLE.format(
                                    ""
                                ).trim()
                            )
                            .setDescription(
                                options.lang.SERVER_PLAYERS_SGL.format(
                                    counts.playerCount
                                )
                            )
                            .setColor(5145560)
                            .setAuthor(
                                "Hypixel",
                                "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                            )
                            .addField(field)
                            .setTimestamp()

                        currentPage = { embed: embed }
                        pages.push(currentPage)
                    } else {
                        currentPage.embed.addField(field)
                        currentPage.embed.fields.sort(
                            (a, b) => a.value.length - b.value.length
                        )
                    }
                })
            }

            if (pages.length == 1)
                Util.sendMessage(options.message, pages[0]).catch((e) => {
                    Util.error(e, "Stats", "sendMessage1")
                })
            else Util.sendPages(options.message, pages)
        })
    }

    hypixelStats_player(options, input) {
        Util.startTyping(options.message).catch((e) => {
            Util.error(e, "Stats", "startTyping2")
        })
        this.client.hypixel
            .player(input)
            .then(async (player) => {
                Util.stopTyping(options.message)

                if (!player) {
                    const embed = new Discord.MessageEmbed()
                        .setTitle(
                            options.lang.COMMAND_STATS_HYPIXEL_PLAYER_FAIL_TITLE
                        )
                        .setDescription(
                            options.lang.COMMAND_STATS_HYPIXEL_PLAYER_FAIL_DESC.format(
                                input
                            )
                        )
                        .setColor(12333616)
                        .setAuthor(
                            "Hypixel",
                            "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                        )
                        .setTimestamp()

                    return Util.sendMessage(options.message, {
                        embed: embed,
                    }).catch((e) => {
                        Util.error(e, "Stats", "sendMessage2")
                    })
                }

                let averageColor = await getAverageColor(
                    `https://mc-heads.net/avatar/${player.uuid}`
                )
                let decimalColor =
                    averageColor.value[0] * 256 * 256 +
                    averageColor.value[1] * 256 +
                    averageColor.value[2]

                const onlineFor =
                    Date.now() - new Date(player.lastLogin).getTime()

                const embed = new Discord.MessageEmbed()
                    .setTitle(
                        options.lang.COMMAND_STATS_HYPIXEL_PLAYER_TITLE.format(
                            player.displayname
                        )
                    )
                    .setDescription(
                        options.lang.COMMAND_STATS_HYPIXEL_PLAYER_DESC.format(
                            player.lastLogin &&
                                player.lastLogout &&
                                player.lastLogin - player.lastLogout > 0
                                ? options.lang.COMMAND_STATS_HYPIXEL_PLAYER_ONLINE.format(
                                      options.lang.TIME_FORMAT.format(
                                          Math.floor(onlineFor / 1000 / 3600),
                                          Math.floor(
                                              (onlineFor / 1000 / 60) % 60
                                          ),
                                          Math.floor((onlineFor / 1000) % 60)
                                      )
                                  )
                                : options.lang.COMMAND_STATS_HYPIXEL_PLAYER_OFFLINE.format(
                                      player.lastLogout
                                          ? new Date(
                                                player.lastLogout
                                            ).toLocaleDateString(options.locale)
                                          : options.lang.UNKNOWN
                                  ),
                            player.firstLogin
                                ? new Date(
                                      player.firstLogin
                                  ).toLocaleDateString(options.locale)
                                : options.lang.NEVER,
                            player._id,
                            player.uuid,
                            player.userLanguage
                                ? player.userLanguage.toTitleCase(true)
                                : options.lang.UNKNOWN,
                            player.rank
                                ? player.rank.toTitleCase(true)
                                : options.lang.NONE,
                            player.friendRequests
                                ? player.friendRequests.length
                                : options.lang.NONE
                        ) +
                            "\n\n" +
                            options.lang.COMMAND_STATS_HYPIXEL_PLAYER_NETSTATS.format(
                                player.networkExp ?? options.lang.NONE,
                                player.karma ?? options.lang.NONE,
                                player.achievementPoints ?? options.lang.NONE,
                                player.achievementsOneTime
                                    ? player.achievementsOneTime.length
                                    : options.lang.NONE,
                                player.mostRecentGameType
                                    ? player.mostRecentGameType
                                          .replace(/_/g, " ")
                                          .toTitleCase(true)
                                    : options.lang.NONE,
                                player.mcVersionRp
                                    ? player.mcVersionRp +
                                          (player.network_update_book
                                              ? " " + player.network_update_book
                                              : "")
                                    : options.lang.UNKNOWN
                            )
                    )
                    .setColor(decimalColor)
                    .setAuthor(
                        "Hypixel",
                        "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                    )
                    .setThumbnail(
                        `https://mc-heads.net/avatar/${player.uuid}/64`
                    )
                    .setTimestamp()

                Util.sendMessage(options.message, embed).catch((e) => {
                    Util.error(e, "Stats", "sendMessage3")
                })
            })
            .catch((error) => {
                Util.stopTyping(options.message)

                const embed = new Discord.MessageEmbed()
                    .setTitle(
                        options.lang.COMMAND_STATS_HYPIXEL_PLAYER_FAIL_TITLE
                    )
                    .setDescription(`${error}`)
                    .setColor(12333616)
                    .setAuthor(
                        "Hypixel",
                        "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                    )
                    .setTimestamp()

                Util.sendMessage(options.message, embed).catch((e) => {
                    Util.error(e, "Stats", "sendMessage4")
                })
            })
    }

    hypixelStats_playerCompare(options, inputs) {
        Util.startTyping(options.message).catch((e) => {
            Util.error(e, "Stats", "startTyping3")
        })

        Promise.all([
            this.client.hypixel.player(inputs[0]),
            this.client.hypixel.player(inputs[1]),
        ])
            .then(async (players) => {
                Util.stopTyping(options.message)
                players.forEach((player) => {
                    if (!player) {
                        const embed = new Discord.MessageEmbed()
                            .setTitle(
                                options.lang
                                    .COMMAND_STATS_HYPIXEL_PLAYER_FAIL_TITLE
                            )
                            .setDescription(
                                options.lang.COMMAND_STATS_HYPIXEL_PLAYER_FAIL_DESC.format(
                                    input
                                )
                            )
                            .setColor(12333616)
                            .setAuthor(
                                "Hypixel",
                                "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                            )
                            .setTimestamp()

                        return Util.sendMessage(options.message, {
                            embed: embed,
                        }).catch((e) => {
                            Util.error(e, "Stats", "sendMessage5")
                        })
                    }
                })

                let joinDates = options.lang.UNKNOWN
                if (players[0].firstLogin && players[1].firstLogin) {
                    let firstJoined = players[0],
                        lastJoined = players[1]
                    if (players[0].firstLogin > players[1].firstLogin) {
                        firstJoined = players[1]
                        lastJoined = players[0]
                    }
                    joinDates =
                        options.lang.COMMAND_STATS_HYPIXEL_COMPARE_JOINED_BOTH.format(
                            firstJoined.displayname,
                            new Date(firstJoined.firstLogin).toLocaleDateString(
                                options.locale
                            ),
                            lastJoined.displayname,
                            new Date(lastJoined.firstLogin).toLocaleDateString(
                                options.locale
                            )
                        )
                } else {
                    let playerJoined, playerNever
                    if (players[0].firstLogin) {
                        playerJoined = players[0]
                        playerNever = players[1]
                    } else if (players[1].firstLogin) {
                        playerJoined = players[1]
                        playerNever = players[0]
                    }

                    if (playerJoined && playerNever) {
                        joinDates =
                            options.lang.COMMAND_STATS_HYPIXEL_COMPARE_JOINED_ONE.format(
                                playerJoined.displayname,
                                new Date(
                                    playerJoined.firstLogin
                                ).toLocaleDateString(options.locale),
                                playerNever.displayname
                            )
                    } else {
                        joinDates =
                            options.lang
                                .COMMAND_STATS_HYPIXEL_COMPARE_JOINED_NEITHER
                    }
                }

                let networkStats = ""
                players.forEach((player) => {
                    player.rank = player.rank
                        ? player.rank.toTitleCase(true)
                        : options.lang.NONE
                    networkStats +=
                        `\n\n**${player.displayname}'s ` +
                        options.lang.COMMAND_STATS_HYPIXEL_PLAYER_NETSTATS.format(
                            player.networkExp ?? options.lang.NONE,
                            player.karma ?? options.lang.NONE,
                            player.achievementPoints ?? options.lang.NONE,
                            player.achievementsOneTime
                                ? player.achievementsOneTime.length
                                : options.lang.NONE,
                            player.mostRecentGameType
                                ? player.mostRecentGameType
                                      .replace(/_/g, " ")
                                      .toTitleCase(true)
                                : options.lang.NONE,
                            player.mcVersionRp
                                ? player.mcVersionRp +
                                      (player.network_update_book
                                          ? " " + player.network_update_book
                                          : "")
                                : options.lang.UNKNOWN
                        ).substr(2)
                })

                const embed = new Discord.MessageEmbed()
                    .setTitle(
                        options.lang.COMMAND_STATS_HYPIXEL_COMPARE_TITLE.format(
                            players[0].displayname,
                            players[1].displayname
                        )
                    )
                    .setDescription(
                        options.lang.COMMAND_STATS_HYPIXEL_COMPARE_DESC.format(
                            joinDates,
                            players[0].rank == players[1].rank
                                ? options.lang.COMMAND_STATS_HYPIXEL_COMPARE_RANK_SAME.format(
                                      players[0].rank
                                  )
                                : options.lang.COMMAND_STATS_HYPIXEL_COMPARE_RANK_DIFF.format(
                                      players[0].displayname,
                                      players[0].rank,
                                      players[1].displayname,
                                      players[1].rank
                                  ),
                            networkStats.trim()
                        )
                    )
                    .setAuthor(
                        "Hypixel",
                        "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                    )
                    .setTimestamp()

                let content = { embed: embed }

                let afterImage = () => {
                    Util.sendMessage(options.message, content).catch((e) => {
                        Util.error(e, "Stats", "sendMessage6")
                    })
                }

                let canvas = Canvas.createCanvas(64, 64)
                let context = canvas.getContext("2d")
                context.imageSmoothingEnabled = false

                let promises = []
                players.forEach((player) => {
                    promises.push(
                        Canvas.loadImage(
                            `https://mc-heads.net/avatar/${player.uuid}`
                        )
                    )
                })
                Promise.all(promises)
                    .then(async (avatars) => {
                        const avatarSize = 37
                        context.drawImage(
                            avatars[1],
                            64 - avatarSize,
                            64 - avatarSize,
                            avatarSize,
                            avatarSize
                        )
                        context.drawImage(
                            avatars[0],
                            0,
                            0,
                            avatarSize,
                            avatarSize
                        )

                        let buffer = canvas.toBuffer("image/png")
                        let averageColor = await getAverageColor(buffer)
                        let decimalColor =
                            averageColor.value[0] * 256 * 256 +
                            averageColor.value[1] * 256 +
                            averageColor.value[2]

                        content.embed.setColor(decimalColor)
                        content.embed.attachFiles([
                            {
                                attachment: buffer,
                                name: "avatars.png",
                            },
                        ])
                        content.embed.setThumbnail("attachment://avatars.png")

                        afterImage()
                    })
                    .catch(afterImage)
            })
            .catch((error) => {
                Util.stopTyping(options.message)

                const embed = new Discord.MessageEmbed()
                    .setTitle(
                        options.lang.COMMAND_STATS_HYPIXEL_PLAYER_FAIL_TITLE
                    )
                    .setDescription(`${error}`)
                    .setColor(12333616)
                    .setAuthor(
                        "Hypixel",
                        "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                    )
                    .setTimestamp()

                Util.sendMessage(options.message, embed).catch((e) => {
                    Util.error(e, "Stats", "sendMessage7")
                })
            })
    }

    hypixelStats_leaderboard(options, input) {
        Util.startTyping(options.message).catch((e) => {
            Util.error(e, "Stats", "startTyping4")
        })
        this.client.hypixel.leaderboards().then((leaderboards) => {
            let pages = []
            let found = false

            Object.keys(leaderboards).forEach((gamemode) => {
                if (gamemode.toLowerCase().replace("_", "") != input) return
                found = true
                let data = leaderboards[gamemode]

                let done2 = 0
                data.forEach(async (board) => {
                    let list = []
                    await new Promise(async (resolve, reject) => {
                        let done = 0
                        board.leaders.forEach(async (uuid, index) => {
                            let history = await Mojang.getNameHistory(uuid)
                            list[index] = `${
                                index < 3
                                    ? [
                                          ":first_place:",
                                          ":second_place:",
                                          ":third_place:",
                                      ][index]
                                    : ":white_small_square:"
                            } **${index + 1}.** ${history.current}`
                            done++
                            if (done >= board.leaders.length) {
                                resolve()
                            }
                        })
                    })

                    const embed = new Discord.MessageEmbed()
                        .setTitle(
                            options.lang.COMMAND_STATS_HYPIXEL_LEADERBOARDS_TITLE.format(
                                gamemode.replace(/_/g, " ").toTitleCase(true)
                            )
                        )
                        .setColor(5145560)
                        .setAuthor(
                            "Hypixel",
                            "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                        )
                        .addField({
                            name: `${board.prefix} ${board.title}`,
                            value: list.join("\n"),
                        })
                        .setTimestamp()

                    pages.push({ embed: embed })
                    done2++

                    if (done2 >= data.length) {
                        Util.stopTyping(options.message)
                        if (pages.length == 1)
                            Util.sendMessage(options.message, pages[0]).catch(
                                (e) => {
                                    Util.error(e, "Stats", "sendMessage8")
                                }
                            )
                        else Util.sendPages(options.message, pages)
                    }
                })
            })

            if (!found) {
                Util.stopTyping(options.message)

                const embed = new Discord.MessageEmbed()
                    .setTitle(
                        options.lang
                            .COMMAND_STATS_HYPIXEL_LEADERBOARDS_FAIL_TITLE
                    )
                    .setDescription(
                        options.lang
                            .COMMAND_STATS_HYPIXEL_LEADERBOARDS_FAIL_DESC
                    )
                    .setColor(12333616)
                    .setAuthor(
                        "Hypixel",
                        "https://cdn.discordapp.com/attachments/797784300975947796/830469241370705950/favicon.png"
                    )
                    .setTimestamp()

                Util.sendMessage(options.message, { embed: embed }).catch(
                    (e) => {
                        Util.error(e, "Stats", "sendMessage9")
                    }
                )
            }
        })
    }

    async botStats(options) {
        const newPage = (pages) => {
            const embed = new Discord.MessageEmbed()
                .setTitle(options.lang.COMMAND_STATS_BOT_TITLE)
                .setColor(5145560)
                .setAuthor(
                    this.client.user.username,
                    this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png",
                    })
                )
                .setFooter(Util.getFooter(options.message).text)
                .setTimestamp()

            let page = { embed: embed }
            pages.push(page)
            return page
        }

        let lastCommand = this.client.lastCommandTime
        let processedCommands = this.client.commandsProcessed

        let os = OSUtils.os
        let cpu = OSUtils.cpu
        let network = OSUtils.netstat

        Util.startTyping(options.message).catch((e) => {
            Util.error(e, "Stats", "startTyping5")
        })

        let osName = statsCache.get("osName")
        let cpuUsage = statsCache.get("cpuUsage")
        let netStats = statsCache.get("networkIO")

        if (!osName) {
            osName = await os.oos()
            statsCache.set("osName", osName)
        }
        if (!cpuUsage) {
            cpuUsage = await cpu.usage()
            statsCache.set("cpuUsage", cpuUsage, 300)
        }
        if (!netStats) {
            netStats = await network.inOut()
            statsCache.set("networkIO", netStats)
        }

        let uptime = os.uptime()
        let memoryUsage = process.memoryUsage().rss

        let users = 0
        this.client.guilds.cache.forEach((guild) => {
            users += guild.memberCount
        })

        let pages = []
        let firstPage = newPage(pages)
        firstPage.embed.addFields([
            {
                name: options.lang.COMMAND_STATS_BOT_FIELD1,
                value: this.client.guilds.cache.size,
                inline: true,
            },
            {
                name: options.lang.COMMAND_STATS_BOT_FIELD2,
                value: users,
                inline: true,
            },
            {
                name: options.lang.COMMAND_STATS_BOT_FIELD3,
                value: this.client.channels.cache.size,
                inline: true,
            },
            {
                name: options.lang.COMMAND_STATS_BOT_FIELD4,
                value: `${this.client.ping}ms`,
                inline: true,
            },
            {
                name: options.lang.COMMAND_STATS_BOT_FIELD5,
                value: processedCommands,
                inline: true,
            },
            {
                name: options.lang.COMMAND_STATS_BOT_FIELD6,
                value: lastCommand
                    ? options.lang.TIME_FORMAT_AGO.format(
                          Math.round((Date.now() - lastCommand) / 1000)
                      )
                    : options.lang.NEVER,
                inline: true,
            },
            {
                name: options.lang.COMMAND_STATS_BOT_FIELD7,
                value: options.lang.COMMAND_STATS_BOT_FIELD7_VAL.format(
                    OSUtils.isNotSupported(osName)
                        ? options.lang.UNKNOWN
                        : osName,
                    options.lang.TIME_FORMAT.format(
                        Math.floor(uptime / 3600),
                        Math.floor((uptime / 60) % 60),
                        Math.floor(uptime % 60)
                    )
                ),
            },
            {
                name: options.lang.COMMAND_STATS_BOT_FIELD8,
                value: OSUtils.isNotSupported(cpuUsage)
                    ? options.lang.NOT_PROVIDED
                    : options.lang.COMMAND_STATS_BOT_FIELD8_VAL.format(
                          cpu.model(),
                          cpu.count(),
                          cpuUsage
                      ),
            },
            {
                name: options.lang.COMMAND_STATS_BOT_FIELD9,
                value: `${Math.round(memoryUsage / (1024 * 1024))}MB`,
                inline: true,
            },
            {
                name: options.lang.COMMAND_STATS_BOT_FIELD10,
                value: OSUtils.isNotSupported(netStats)
                    ? options.lang.NOT_PROVIDED
                    : options.lang.COMMAND_STATS_BOT_FIELD10_VAL.format(
                          netStats.total.inputMb,
                          netStats.total.outputMb
                      ),
                inline: true,
            },
        ])

        const botGuild = await Util.getGuildById(
            this.client,
            LocalSettings.botserver.id
        )
        const rndImgChannel = botGuild
            ? Util.getChannelById(
                  botGuild.channels,
                  LocalSettings.botserver.channels.random
              )
            : null

        let countGraphUrl = graphCache.get("serverCount")
        if (!countGraphUrl && rndImgChannel) {
            let log = await this.client.globalSettings.get("ServerCountLog")
            log.push({ x: Date.now(), y: this.client.guilds.cache.size })

            let graph = Util.createGraph(
                log,
                {
                    name: options.lang.COMMAND_STATS_BOT_GRAPH_COUNT_X,
                    start: Date.now() - this.client.countCaptureMax,
                    max: Date.now(),
                    increment: this.client.countCaptureEvery * 4,
                    formatter: (value) => {
                        return new Date(value).toLocaleDateString(
                            options.locale
                        )
                    },
                },
                {
                    name: options.lang.COMMAND_STATS_BOT_GRAPH_COUNT_Y,
                    increment: 25,
                }
            )

            try {
                let message = await Util.sendMessage(rndImgChannel, {
                    files: [
                        {
                            attachment: graph.toBuffer("image/png"),
                            name: `graph-servercount-${Date.now()}.png`,
                        },
                    ],
                })
                let image = message.attachments.first()
                if (image) {
                    countGraphUrl = image.url
                    graphCache.set("serverCount", countGraphUrl)
                }
            } catch (e) {}
        }

        if (countGraphUrl) {
            let graphPage = newPage(pages)
            graphPage.embed.setImage(countGraphUrl)
        }

        let memoryGraphUrl = graphCache.get("memory")
        if (!memoryGraphUrl && rndImgChannel) {
            let log = []
            this.client.memoryLog.forEach((value) => {
                log.push(value)
            })
            log.push({
                x: Date.now(),
                y: memoryUsage,
            })

            let graph = Util.createGraph(
                log,
                {
                    name: options.lang.COMMAND_STATS_BOT_GRAPH_MEM_X,
                    clamp: true,
                    increment: this.client.memoryCaptureEvery * 5,
                    formatter: (value) => {
                        return new Date(value).toLocaleTimeString(
                            options.locale,
                            {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                            }
                        )
                    },
                },
                {
                    name: options.lang.COMMAND_STATS_BOT_GRAPH_MEM_Y,
                    increment: 10 * (1024 * 1024),
                    formatter: (value) => {
                        return Math.round(value / (1024 * 1024))
                    },
                }
            )

            try {
                let message = await Util.sendMessage(rndImgChannel, {
                    files: [
                        {
                            attachment: graph.toBuffer("image/png"),
                            name: `graph-memory-${Date.now()}.png`,
                        },
                    ],
                })
                let image = message.attachments.first()
                if (image) {
                    memoryGraphUrl = image.url
                    graphCache.set(
                        "memory",
                        memoryGraphUrl,
                        (this.client.memoryCaptureEvery * 2) / 1000
                    )
                }
            } catch (e) {}
        }

        if (memoryGraphUrl) {
            let graphPage = newPage(pages)
            graphPage.embed.setImage(memoryGraphUrl)
        }

        Util.stopTyping(options.message)

        Util.sendPages(options.message, pages)
    }

    async execute(options) {
        return this.executeOptionTree(options)
    }
}

module.exports = Command
