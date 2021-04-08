const OSUtils = require("node-os-utils")
const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "stats",
            desc: "View statistics",
            args: [{
                name: "type",
                desc: "The type of statistics you would like to see"
            },
            {
                name: "options",
                desc: "Options for specific statistic types",
                optional: true,
                multiple: true
            }]
        })
    }

    async botStats(message) {
        let os = OSUtils.os
        let cpu = OSUtils.cpu
        let network = OSUtils.netstat

        Util.startTyping(message).catch(console.error)

        let osName = await os.oos()
        let cpuUsage = await cpu.usage()
        let netStats = await network.inOut()
        let uptime = os.uptime()

        let users = 0
        this.client.guilds.cache.forEach(guild => {
            users += guild.memberCount
        })

        Util.stopTyping(message)

        Util.sendMessage(message, {
            embed: {
                title: "Stats",
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                color: 5145560,
                fields: [
                    {
                        name: "Version",
                        value: process.env.npm_package_version,
                        inline: true
                    },
                    {
                        name: "Servers",
                        value: this.client.guilds.cache.size,
                        inline: true
                    },
                    {
                        name: "Users",
                        value: users,
                        inline: true
                    },
                    {
                        name: "Server",
                        value: `Shared Heroku System - OS: ${OSUtils.isNotSupported(osName) ? "Unknown" : osName} - Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime / 60) % 60)}m ${Math.floor(uptime % 60)}s`
                    },
                    {
                        name: "CPU",
                        value: OSUtils.isNotSupported(cpuUsage) ? "Not supported" : `${cpu.model()} - ${cpu.count()} core(s) (${cpuUsage}%)`
                    },
                    {
                        name: "Memory Usage",
                        value: `${Math.round(process.memoryUsage().rss / (1024*1024))}MB`,
                        inline: true
                    },
                    {
                        name: "Network Average",
                        value: OSUtils.isNotSupported(netStats) ? "Not supported" : `In: ${netStats.total.inputMb}Mb, Out: ${netStats.total.outputMb}Mb`,
                        inline: true
                    }
                ],
                timestamp: Date.now(),
                footer: Util.getFooter(this.client)
            }
        }).catch(console.error)
    }

    async hypixelStats(message, inputs) {
        const types = {
            players: () => {
                Util.startTyping(message).catch(console.error)
                this.client.hypixel.counts().then(counts => {
                    Util.stopTyping(message)

                    
                })
            }
        }

        let type = inputs.shift().toLowerCase()
        let method = types[type]
        if (method == null) {
            return Util.replyError(message, `Invalid hypixel stat, statistic types: \`\`${Object.keys(types).join("``, ``")}\`\``)
        }

        method(inputs)
    }

    async execute(message, inputs) {
        const types = {
            bot: "botStats"
            //hypixel: "hypixelStats"
        }

        let type = inputs.shift().toLowerCase()
        let method = types[type]
        if (method == null) {
            return Util.replyError(message, `Invalid type, types: \`\`${Object.keys(types).join("``, ``")}\`\``)
        }

        this[method](message, inputs)
    }
}

module.exports = Command