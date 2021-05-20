const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "guilds",
            descId: "COMMAND_DEV_GUILDS",
            args: [
                {
                    name: "search",
                    optional: true
                }
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async getServer(options, guild, check) {
        if (check) {
            let result = await Promise.resolve(check(guild))
            if (!result) return;
        }

        const settingsCommand = this.client.commands.get("settings")
        
        let owner = guild.owner ?? await Util.getMember(guild, guild.ownerID)
        let priorityChannel = Util.getPriorityChannel(guild, chl => Util.hasPermissionsInChannel(guild.me, chl, ["SEND_MESSAGES"]))

        const localSettings = this.client.settings[options.guild.id]
        let prefix = await localSettings.get("prefix", "Prefix")

        return {
            embed: {
                author: {
                    name: guild.name,
                    icon_url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                },
                description: `**Id:** \`\`${guild.id}\`\`\n**Locale:** \`\`${guild.preferredLocale}\`\`\n**Owner:** \`\`${owner && owner.user ? owner.user.tag : "Unknown"}\`\`\n**Members:** \`\`${guild.memberCount}\`\`\n**Channels:** \`\`${guild.channels.cache.size}\`\`\n**Priority Channel:** \`\`${priorityChannel ? `${priorityChannel.id}` : "None"}\`\`\n\n**Settings:**\n${await settingsCommand.formatSettings(options, guild)}\n\n**Permissions:**\n\`\`${guild.me.permissions.toArray().join("``, ``")}\`\``,
                color: 4317012,
                timestamp: Date.now()
            }
        }
    }

    async execute(options) {
        let cache = this.client.guilds.cache

        const propertyChecks = {
            id: {
                needValue: true,
                check: (guild, value) => {
                    return guild.id == value;
                }
            },
            name: {
                needValue: true,
                check: (guild, value) => {
                    return guild.name.toLowerCase().includes(value);
                }
            },
            owner: {
                needValue: true,
                check: async (guild, value) => {
                    let owner = guild.owner ?? await Util.getMember(guild, guild.ownerID)
                    if (!owner || !owner.user) return false;
                    return owner.user.username.toLowerCase().includes(value);
                }
            },
            "members>": {
                needValue: true,
                check: async (guild, value) => {
                    return guild.memberCount >= value;
                }
            },
            "members<": {
                needValue: true,
                check: async (guild, value) => {
                    return guild.memberCount <= value;
                }
            },
            prefix: {
                needValue: true,
                check: async (guild, value) => {
                    let prefix = await this.client.settings[guild.id].get("prefix", "Prefix");
                    return prefix.toLowerCase() == value;
                }
            },
            ip: {
                needValue: true,
                check: async (guild, value) => {
                    let ip = await this.client.settings[guild.id].get("server", "Ip");
                    return ip.toLowerCase().includes(value);
                }
            },
            port: {
                needValue: true,
                check: async (guild, value) => {
                    let port = await this.client.settings[guild.id].get("server", "Port");
                    return port == value;
                }
            },
            queryport: {
                needValue: true,
                check: async (guild, value) => {
                    let port = await this.client.settings[guild.id].get("server", "QueryPort");
                    return port == value;
                }
            },
            hasstatuschannel: {
                needValue: false,
                check: async (guild) => {
                    let statuschannel = await this.client.settings[guild.id].get("statuschannel")
                    return statuschannel.ChannelId != "0"
                }
            },
            hasserver: {
                needValue: false,
                check: async (guild) => {
                    let ip = await this.client.settings[guild.id].get("server", "Ip");
                    return ip != "0.0.0.0"
                }
            },
        }

        const amplifiers = {
            "=": (bool) => {
                return bool
            },
            "!": (bool) => {
                return !bool
            }
        }

        let check
        if (options.inputs[0]) {
            const AND = ["+", "&"]
            const search = options.inputs[0].toLowerCase().split(" ")
            let checks = []
            
            let isValue = false
            let next = false
            let error = false

            search.forEach((string, index) => {
                if (error) return;

                if (isValue) {
                    isValue = false
                    return
                }

                if (next) {
                    if (!AND.includes(string)) {
                        if (propertyChecks[string]) {
                            error = true
                            Util.sendError(options.message, `Expected "+" or "&" before next property`)
                        } else {
                            let value = checks[checks.length - 1].value
                            if (!value) value = "";
                            value += " " + string
                            checks[checks.length - 1].value = value
                        }
                    } else next = false;
                    return
                }

                let amplifier = amplifiers[string.substr(0, 1)]
                if (amplifier) string = string.substr(1);

                let property = propertyChecks[string]
                if (!property) {
                    error = true
                    return Util.sendError(options.message, `Invalid property '${string}', properties: \`\`${Object.keys(propertyChecks).join("``, ``")}\`\``)
                }

                let value = search[index + 1]
                if (property.needValue && (!value || AND.includes(value))) {
                    error = true
                    return Util.sendError(options.message, `Search argument required for '${string}' property`)
                } else if (property.needValue) {
                    isValue = true
                    value = value.toLowerCase().trim()
                }

                checks.push({
                    amplifier: amplifier ?? amplifiers["="],
                    propertyCheck: property.check,
                    value: value
                })

                next = true
            })

            if (error) return;

            check = (guild) => {
                return new Promise((resolve, reject) => {
                    let bool = true
                    let done = 0
                    checks.forEach(async data => {
                        bool = data.amplifier(await Promise.resolve(data.propertyCheck(guild, data.value))) && bool
                        done++
                        if (done == checks.length) resolve(bool);
                    })
                })
            }
        }

        Util.startTyping(options.message).catch(e => {
            console.error(`Guilds[startTyping]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })

        let promise = new Promise((resolve, reject) => {
            const maxPages = 75
            let pages = []
            let done = 0
            cache.forEach(async guild => {
                if (pages.length >= maxPages) return;
                
                this.getServer(options, guild, check).then(page => {
                    if (page && pages.length < maxPages) {
                        pages.push(page)
                    }
                }).catch(e => {
                    console.error(`Guilds[getServer]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                }).finally(() => {
                    done++
                    if (pages.length >= maxPages || done == cache.size) resolve(pages)
                })
            })
        })

        promise.then(pages => {
            Util.stopTyping(options.message)
            pages = pages.filter(value => value != null)

            if (pages.length == 0) return Util.sendWarning(options.message, "No servers found");
            if (pages.length == 1) return Util.sendMessage(options.message, pages[0]);
            Util.sendPages(options.message, pages)
        }).catch(e => {
            console.error(`Guilds[getGuilds]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }
}

module.exports = Command