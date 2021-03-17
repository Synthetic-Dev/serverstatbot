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
        let cpu = OSUtils.cpu
        let memory = OSUtils.mem
        let network = OSUtils.netstat

        let cpuUsage = await cpu.usage()
        let memoryUsage = await memory.used()
        let netStats = await network.inOut()

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
                        name: "CPU",
                        value: `${cpu.model()} - ${cpu.count()} core(s) (${cpuUsage}%)`
                    },
                    {
                        name: "Memory",
                        value: `${memoryUsage.usedMemMb}MB (${Math.round((memoryUsage.usedMemMb / memoryUsage.totalMemMb) * 10000) / 100}%)`
                    },
                    {
                        name: "Network",
                        value: OSUtils.isNotSupported(netStats) ? "Not supported" : `In: ${netStats.total.inputMb}Mb\nOut: ${netStats.total.outputMb}Mb`,
                        inline: true
                    }
                ],
                footer: Util.getFooter(this.client)
            }
        })
    }
}

module.exports = Command