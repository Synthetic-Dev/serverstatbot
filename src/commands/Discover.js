const Util = require("../utils/util.js")
const Protocol = require("../utils/protocol.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "discover",
            descId: "COMMAND_DISCOVER",
            aliases: [
                "servers",
                "discovery",
                "discoverservers",
                "serverdiscovery",
                "findservers"
            ],
            tags: [
                "CAN_DISABLE"
            ]
        })
    }

    async execute(options) {
        Util.startTyping(options.message).catch(e => {
            console.error(`Discover[startTyping]: ${e.toString()};\n${e.method} at ${e.path}`)
        })

        const itemsPerPage = 16

        options.settings.search("server", {Discovery: true}).then(docs => {
            let ips = []
            let servers = docs.filter(doc=> {
                if (Protocol.blockedHosts.includes(doc.Ip) || ips.includes(doc.Ip)) return false;
                ips.push(doc.Ip)
                return true
            })

            Util.stopTyping(options.message)

            if (servers.length == 0) {
                return Util.replyMessage(options.message, {
                    embed: {
                        title: options.lang.COMMAND_DISCOVER_NONE_TITLE,
                        description: options.lang.COMMAND_DISCOVER_NONE_DESC.format(options.prefix),
                        color: 5145560,
                        timestamp: Date.now()
                    }
                })
            }

            let pages = []
            let listString = ""
            servers.forEach((server, index) => { 
                if (server._guildId == options.guild.id) {
                    listString += `:diamond_shape_with_a_dot_inside: **${server.Ip}:${server.Port}**\n`
                } else {
                    listString += `:small_blue_diamond: ${server.Ip}:${server.Port}${server.DiscoveryInvite != "" ? ` [(Discord)](https://discord.gg/${server.DiscoveryInvite})` : ""}\n`
                }

                if ((index % (itemsPerPage - 1) == 0 && index != 0) || index + 1 == servers.length) {
                    pages.push({
                        embed: {
                            title: options.lang.COMMAND_DISCOVER_TITLE,
                            description: listString,
                            color: 5145560,
                            timestamp: Date.now(),
                            footer: Util.getFooter(options.message)
                        }
                    })

                    listString = ""
                }
            })

            if (pages.length == 1) Util.sendMessage(options.message, pages[0]).catch(e => {
                console.error(`Discover[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
            });
            else Util.sendPages(options.message, pages);
        }).catch(e => {
            Util.stopTyping(options.message)
            Util.replyError(options.message, options.lang.COMMAND_DISCOVER_ERROR)

            console.error(`Discover[searchSetting]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command