const OSUtils = require("node-os-utils")
const Util = require("../utils/util.js")
const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "stats",
            desc: "Hardware information about the bot"
        })
    }

    async execute(message) {
        let os = OSUtils.os
        let cpu = OSUtils.cpu
        let memory = OSUtils.mem
        let network = OSUtils.netstat

        Util.sendMessage(message.channel, ":arrows_counterclockwise: Collecting stats...").then(async botMessage => {
            let osName = await os.oos()
            let cpuUsage = await cpu.usage()
            let memoryUsage = await memory.used()
            let netStats = await network.inOut()

            let uptime = os.uptime()

            botMessage.delete().catch(e => {})

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
                            value: this.client.users.cache.size,
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
                            name: "Memory",
                            value: OSUtils.isNotSupported(memoryUsage) ? "Not supported" : `${Math.round(memoryUsage.totalMemMb / 1024)}GB (${Math.round((memoryUsage.usedMemMb / memoryUsage.totalMemMb) * 10000) / 100}%)`,
                            inline: true
                        },
                        {
                            name: "Network Average",
                            value: OSUtils.isNotSupported(netStats) ? "Not supported" : `In: ${netStats.total.inputMb}Mb, Out: ${netStats.total.outputMb}Mb`,
                            inline: true
                        }
                    ],
                    footer: Util.getFooter(this.client)
                }
            })
        })
    }
}

module.exports = Command