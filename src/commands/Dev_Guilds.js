const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "guilds",
            desc: "View and search connected guilds and details",
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

    async getServer(toGuild, guild, check) {
        if (check) {
            let result = await Promise.resolve(check(guild))
            if (!result) return;
        }

        const settings = this.client.settings[guild.id]
        
        let logchannel = await settings.get("logchannel")
        let disabledCommands = await settings.get("disabledCommands")
        let owner = guild.owner ? guild.owner : await Util.getMember(guild, guild.ownerID)
        
        let ip = await settings.get("ip");
        let port = await settings.get("port");

        const localSettings = this.client.settings[toGuild.id]

        let prefix = await localSettings.get("prefix")

        return {
            embed: {
                author: {
                    name: guild.name,
                    icon_url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                },
                description: `**Id:** \`\`${guild.id}\`\`\n**Owner:** \`\`${owner && owner.user ? owner.user.tag : "Unknown"}\`\`\n**Members:** \`\`${guild.memberCount}\`\`\n\`\`${prefix}ping ${ip}:${port}\`\`\n\nSettings:\n• **Prefix:** \`\`${await settings.get("prefix")}\`\`\n• **Ip:** \`\`${ip}\`\`\n• **Port:** \`\`${port}\`\`\n• **Log channel:** ${logchannel == "0" ? "None" : `${await settings.get("logchannel")}`}\n• **Disabled commands:** ${disabledCommands.length > 0 ? disabledCommands.join(", ") : "None"}\n\nPermissions:\n\`\`${guild.me.permissions.toArray().join("``, ``")}\`\``,
                color: 927567,
                timestamp: Date.now()
            }
        }
    }

    async execute(message, inputs) {
        let cache = this.client.guilds.cache

        const propertyChecks = {
            name: {
                needValue: true,
                check: (guild, value) => {
                    return guild.name.toLowerCase().includes(value);
                }
            },
            owner: {
                needValue: true,
                check: async (guild, value) => {
                    let owner = guild.owner ? guild.owner : await Util.getMember(guild, guild.ownerID)
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
                    let prefix = await this.client.settings[guild.id].get("prefix");
                    return prefix.toLowerCase() == value;
                }
            },
            ip: {
                needValue: true,
                check: async (guild, value) => {
                    let ip = await this.client.settings[guild.id].get("ip");
                    return ip.toLowerCase() == value;
                }
            },
            port: {
                needValue: true,
                check: async (guild, value) => {
                    let port = await this.client.settings[guild.id].get("port");
                    return port == value;
                }
            },
            haslogchannel: {
                needValue: false,
                check: async (guild) => {
                    let logchannel = await this.client.settings[guild.id].get("logchannel")
                    return logchannel != "0"
                }
            },
            hasserver: {
                needValue: false,
                check: async (guild) => {
                    let ip = await this.client.settings[guild.id].get("ip");
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
        if (inputs[0]) {
            const AND = ["+", "&"]
            const search = inputs[0].toLowerCase().split(" ")
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
                            Util.sendError(message, `Expected "+" or "&" before next property`)
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
                    return Util.sendError(message, `Invalid property '${string}', properties: \`\`${Object.keys(propertyChecks).join("``, ``")}\`\``)
                }

                let value = search[index + 1]
                if (property.needValue && (!value || AND.includes(value))) {
                    error = true
                    return Util.sendError(message, `Search argument required for '${string}' property`)
                } else if (property.needValue) {
                    isValue = true
                    value = value.toLowerCase().trim()
                }

                checks.push({
                    amplifier: amplifier ? amplifier : amplifiers["="],
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

        Util.startTyping(message).catch(e => {
            console.error(`Guilds[startTyping]: ${e.toString()};\n${e.method} at ${e.path}`)
        })

        let promise = new Promise((resolve, reject) => {
            let pages = []
            let done = 0
            cache.forEach(async guild => {
                if (pages.length >= 75) return;
                
                this.getServer(message.guild, guild, check).then(page => {
                    if (pages.length >= 75) return;
                    if (page) {
                        done++
                        pages.push(page)
                    }
                    if (pages.length >= 75 || done == cache.size) resolve(pages)
                }).catch(e => {
                    console.error(`Guilds[getServer]: ${e.toString()};\n${e.method} at ${e.path}`)
                })
            })
        })

        promise.then(pages => {
            Util.stopTyping(message)
            pages = pages.filter(value => value != null)

            if (pages.length == 0) return Util.sendWarning(message.channel, "No servers found");

            Util.sendPages(message, pages)
        }).catch(e => {
            console.error(`Guilds[getGuilds]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command