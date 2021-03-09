const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "devservers",
            desc: "View and search connected servers and details",
            aliases: [
                "dservers",
                "dsrvs"
            ],
            args: [
                {
                    name: "property",
                    optional: true
                },
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
        
        let logchannel = await settings.getSetting("logchannel")
        let owner = guild.owner ? guild.owner : await Util.getMember(guild, guild.ownerID)
        
        let ip = await settings.getSetting("ip");
        let port = await settings.getSetting("port");

        const localSettings = this.client.settings[toGuild.id]

        let prefix = await localSettings.getSetting("prefix")

        return {
            embed: {
                author: {
                    name: guild.name,
                    icon_url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                },
                description: `**Id:** \`\`${guild.id}\`\`\n**Owner:** \`\`${owner && owner.user ? owner.user.tag : "Unknown"}\`\`\n\`\`${prefix}ping ${ip}:${port}\`\`\n\nSettings:\n• **Prefix:** \`\`${await settings.getSetting("prefix")}\`\`\n• **Ip:** \`\`${ip}\`\`\n• **Port:** \`\`${port}\`\`\n• **Log channel:** ${logchannel == "0" ? "None" : `${await settings.getSetting("logchannel")}`}\n\nPermissions:\n\`\`${guild.me.permissions.toArray().join("``, ``")}\`\``,
                color: 5145560
            }
        }
    }

    async execute(message, inputs) {
        let cache = this.client.guilds.cache

        let propertyChecks = {
            name: {
                needSearch: true,
                check: (guild) => {
                    let search = inputs[1]
                    if (guild.name.substr(0, search.length).toLowerCase() == search) return true;
                    return false;
                }
            },
            owner: {
                needSearch: true,
                check: async (guild) => {
                    let search = inputs[1]
                    let owner = guild.owner ? guild.owner : await Util.getMember(guild, guild.ownerID)
                    if (!owner || !owner.user) return false;
                    if (owner.user.username.substr(0, search.length).toLowerCase() == search) return true;
                    return false;
                }
            },
            prefix: {
                needSearch: true,
                check: async (guild) => {
                    let search = inputs[1]
                    let prefix = await this.client.settings[guild.id].getSetting("prefix");
                    if (prefix.substr(0, search.length).toLowerCase() == search) return true;
                    return false;
                }
            },
            ip: {
                needSearch: true,
                check: async (guild) => {
                    let search = inputs[1]
                    let ip = await this.client.settings[guild.id].getSetting("ip");
                    if (ip.substr(0, search.length).toLowerCase() == search) return true;
                    return false;
                }
            },
            port: {
                needSearch: true,
                check: async (guild) => {
                    let search = inputs[1]
                    let port = await this.client.settings[guild.id].getSetting("port");
                    if (port.substr(0, search.length).toLowerCase() == search) return true;
                    return false;
                }
            },
            haslogchannel: {
                needSearch: false,
                check: async (guild) => {
                    let logchannel = await this.client.settings[guild.id].getSetting("logchannel")
                    return logchannel != "0"
                }
            },
            hasserver: {
                needSearch: false,
                check: async (guild) => {
                    let ip = await this.client.settings[guild.id].getSetting("ip");
                    return ip != "0.0.0.0"
                }
            },
        }
        let amplifiers = {
            "!": (bool) => {
                return !bool
            }
        }

        let check
        if (inputs[0]) {
            inputs[0] = inputs[0].toLowerCase();
            let amplifier = amplifiers[inputs[0].substr(0, 1)]
            if (amplifier) inputs[0] = inputs[0].substr(1);

            let property = propertyChecks[inputs[0]]
            if (!property) return Util.sendError(message.channel, `Invalid property, properties: \`\`${Object.keys(propertyChecks).join("``, ``")}\`\``);

            if (property.needSearch && !inputs[1]) return Util.sendError(message.channel, "Search argument required");
            if (inputs[1]) inputs[1] = inputs[1].toLowerCase().trim();

            if (amplifier) {
                check = async (guild) => {
                    return amplifier(await Promise.resolve(property.check(guild)))
                }
            } else check = property.check;
        }

        Util.sendMessage(message.channel, ":arrows_counterclockwise: Getting servers...").then(botMessage => {
            let promises = []
            cache.forEach(guild => {
                promises.push(this.getServer(message.guild, guild, check))
            })

            Promise.all(promises).then(pages => {
                try {
                    botMessage.delete()
                } catch(e) {console.error(e)}

                pages = pages.filter(value => value != null)

                if (pages.length == 0) {
                    return Util.sendWarning(message.channel, "No servers found")
                }

                Util.sendPages(message, pages)
            })
        }).catch(e=>{})
    }
}

module.exports = Command