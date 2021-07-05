const Discord = require("discord.js")

const Util = require("../utils/Util")
const Protocol = require("../utils/Protocol")
const CommandBase = require("../classes/CommandBase")

const itemsPerPage = 16

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
                "findservers",
            ],
            tags: ["CAN_DISABLE"],
        })
    }

    async execute(options) {
        Util.startTyping(options.message).catch((e) => {
            Util.error(e, "Discover", "startTyping")
        })

        options.settings
            .search("server", { Discovery: true })
            .then((docs) => {
                let ips = []
                let servers = docs.filter((doc) => {
                    if (
                        Protocol.blockedHosts.includes(doc.Ip) ||
                        ips.includes(doc.Ip)
                    )
                        return false
                    ips.push(doc.Ip)
                    return true
                })

                Util.stopTyping(options.message)

                if (servers.length == 0) {
                    const embed = new Discord.MessageEmbed()
                        .setTitle(options.lang.COMMAND_DISCOVER_NONE_TITLE)
                        .setDescription(
                            options.lang.COMMAND_DISCOVER_NONE_DESC.format(
                                options.prefix
                            )
                        )
                        .setColor(5145560)
                        .setTimestamp()

                    return Util.replyMessage(options.message, embed).catch(
                        (e) => {
                            Util.error(e, "Discover", "replyMessage")
                        }
                    )
                }

                let pages = []
                let listString = ""
                servers.forEach((server, index) => {
                    if (server._guildId == options.guild.id) {
                        listString += `:diamond_shape_with_a_dot_inside: **${server.Ip}:${server.Port}**\n`
                    } else {
                        listString += `:small_blue_diamond: ${server.Ip}:${
                            server.Port
                        }${
                            server.DiscoveryInvite != ""
                                ? ` [(Discord)](https://discord.gg/${server.DiscoveryInvite})`
                                : ""
                        }\n`
                    }

                    if (
                        (index % (itemsPerPage - 1) == 0 && index != 0) ||
                        index + 1 == servers.length
                    ) {
                        const embed = new Discord.MessageEmbed()
                            .setTitle(options.lang.COMMAND_DISCOVER_TITLE)
                            .setDescription(listString)
                            .setColor(5145560)
                            .setFooter(Util.getFooter(options.message).text)
                            .setTimestamp()

                        pages.push({ embed: embed })
                        listString = ""
                    }
                })

                if (pages.length == 1)
                    return Util.sendMessage(options.message, pages[0]).catch(
                        (e) => {
                            Util.error(e, "Discover", "sendMessage")
                        }
                    )

                Util.sendPages(options.message, pages)
            })
            .catch((e) => {
                Util.stopTyping(options.message)
                Util.replyError(
                    options.message,
                    options.lang.COMMAND_DISCOVER_ERROR
                )

                Util.error(e, "Discover", "search")
            })
    }
}

module.exports = Command
