const Discord = require("discord.js")
const HTTPS = require("https")
const HTTP = require("http")
const FileSystem = require("fs");

const unicodeEmojis = require("./unicodeEmojis.json");
const DevId = "255733848162304002"

class Util {
    constructor() {
        console.error(`The ${this.constructor.name} class cannot be constructed.`);
    }

    /**
     * Gets the ping between the bot and discord relative to the time the message was created
     * @param {Discord.Message} message A recently recieved discord message
     * @return {number}
     */
    static ping(message) {
        return Date.now() - message.createdTimestamp
    }

    /**
     * Returns a promise that timesout after milliseconds
     * @param {number} milliseconds 
     * @return {Promise}
     */
    static sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    /**
     * Sends a request to the given request options
     * @param {string | HTTP.RequestOptions | HTTPS.RequestOptions} options The request options
     * @param {Function} callback A function that is called when a response is received
     */
    static request(options, callback) {
        const isUrl = typeof options == "string"
        const method = isUrl ? (options.toLowerCase().slice(0, 5) == "https" ? HTTPS : HTTP) : (options.protocol == "HTTP" ? HTTP : HTTPS)

        let handler = response => {
            let data = ""

            response.on("data", chunk => {
                data += chunk
            })

            response.on("end", () => {
                callback(true, data)
            })
        }

        let req
        if (isUrl) {
            req = method.get(options, handler)
        } else {
            req = method.request(options, handler)
        }

        req.on("error", error => {
            callback(false, error)
        })

        if (!isUrl) {
            if (options.data) req.write(options.data);
            req.end()
        };
    }

    /**
     * Sends a request to the given request options
     * @param {string | HTTP.RequestOptions | HTTPS.RequestOptions} options The request options
     * @returns {Promise<string>} A promise that resolves with the response
     */
    static requestAsync(options) {
        return new Promise((resolve, reject) => {
            const isUrl = typeof options == "string"
            const method = isUrl ? (options.toLowerCase().slice(0, 5) == "https" ? HTTPS : HTTP) : (options.protocol == "HTTP" ? HTTP : HTTPS)
            delete options.protocol

            let handler = response => {
                let data = ""
    
                response.on("data", chunk => {
                    data += chunk
                })
    
                response.on("end", () => {
                    resolve(data)
                })
            }

            let req
            if (isUrl) {
                req = method.get(options, handler)
            } else {
                req = method.request(options, handler)
            }

            req.on("error", error => {
                reject(error)
            })

            if (!isUrl) {
                if (options.data) req.write(options.data);
                req.end()
            };
        })
    }

    /**
     * Loads .js files from the given directory
     * @param {string} dir Directory to the folder that holds all the modules to be loaded
     * @param {Function} register A function that is called that registers the modules into the Collection
     * @returns {Discord.Collection} A collection that contains all of the loaded modules
     */
    static loadmodules(dir, register) {
        const modules = new Discord.Collection()

        FileSystem.readdir(`${__dirname}/../${dir}`, (error, files) => {
            if (error) console.error(error);
            if (!files) return console.log(`There are no files at /${dir}`);

            const jsfiles = files.filter(file => file.split(".").pop() == "js")

            if (jsfiles.length === 0) return console.log(`No .js files to load at /${dir}`);

            jsfiles.forEach(file => {
                let Module = require(`../${dir}/${file}`)

                if (register) {
                    register(Module, modules)
                } else {
                    let module = new Module()
                    modules.set(module.name(), module)
                }
            })
        })

        return modules
    }

    static fillMixedText(context, splitText, x, y) {
        let defaultFillStyle = context.fillStyle
        let defaultFont = context.font
        context.save()

        splitText.forEach(({text, fillStyle, font}) => {
            context.fillStyle = fillStyle || defaultFillStyle;
            context.font = font || defaultFont;
            context.fillText(text, x, y);
            x += context.measureText(text).width;
        });
        ctx.restore();
    };

    /**
     * DMs a user with the given text
     * @param {Discord.User} user
     * @param {Discord.APIMessageContentResolvable | Discord.MessageAdditions | (Discord.MessageOptions & {split?: false;})} content 
     * @returns {Promise<Discord.Message?>}
     */
    static dmUser(user, content) {
        return new Promise((resolve, reject) => {
            user.createDM().then(dmChannel => {
                this.sendMessage(dmChannel, content).then(resolve).catch(reject)
            }).catch(reject)
        })
    }

    /**
     * Replies to the message with the given text, includes error handling
     * @param {Discord.Message} message 
     * @param {Discord.APIMessageContentResolvable | Discord.MessageAdditions | (Discord.MessageOptions & {split?: false;})} content 
     * @returns {Promise<Discord.Message>}
     */
    static replyMessage(message, content) {
        return new Promise((resolve, reject) => {
            const stringAble = ["string", "number", "bigint", "boolean", "symbol"].includes(typeof content)
            if (stringAble) content = "\n" + content;
            
            let channel = message.channel
            if (channel instanceof Discord.DMChannel) {
                message.reply(content).then(resolve).catch(reject)
            } else {
                let hasPerms = this.doesMemberHavePermissionsInChannel(message.guild.me, channel, ["SEND_MESSAGES"])
                if (!hasPerms) {
                    this.cannotSendMessages(message.author, channel).then(reject)
                } else {
                    message.reply(content).then(resolve).catch(e => {
                        this.dmUser(message.author, `:stop_sign: Failed to reply with message in <#${channel.id}>!\n` + (stringAble ? content : ""), !stringAble ? content : null).then(() => {reject(e)}).catch(reject)
                    })
                }
            }
        })
    }

    /**
     * Sends a message in the given channel, includes error handling
     * @param {Discord.TextChannel | Discord.DMChannel | Discord.Message} medium 
     * @param {Discord.APIMessageContentResolvable | Discord.MessageAdditions | (Discord.MessageOptions & {split?: false;})} content 
     * @returns {Promise<Discord.Message>}
     */
    static async sendMessage(medium, ...content) {
        return new Promise((resolve, reject) => {
            const stringAble = ["string", "number", "bigint", "boolean", "symbol"].includes(typeof content)
            if (stringAble) content = "\n" + content;

            let isMessage = medium instanceof Discord.Message
            let channel = isMessage ? medium.channel : medium
            if (channel instanceof Discord.DMChannel) {
                channel.send(...content).then(resolve).catch(reject)
            } else {
                let hasPerms = this.doesMemberHavePermissionsInChannel(channel.guild.me, channel, ["SEND_MESSAGES"])
                if (isMessage && !hasPerms) {
                    this.cannotSendMessages(medium.author, channel).then(reject)
                } else if(hasPerms) {
                    channel.send(...content).then(resolve).catch(e => {
                        if (isMessage) this.dmUser(message.author, `:stop_sign: Failed to send message in <#${channel.id}>!`).then(() => {reject(e)}).catch(reject);
                    })
                }
            }
        })
    }

    /**
     * Sends a message to a user messages are missing to send messages in the given channel
     * @param {Discord.User} user
     * @param {Discord.TextChannel | Discord.DMChannel} channel 
     * @returns {Promise<Discord.Message>}
     */
    static cannotSendMessages(user, channel) {
        return new Promise((resolve, reject) => {
            this.dmUser(user, `:stop_sign: I don't have permission to send messages in <#${channel.id}>!`).then(() => {
                resolve(new Error(`Missing permissions to send message in channel ${channel.id}`))
            }).catch(resolve)
        })
    }

    /**
     * Replies to the message with the given warning text
     * @param {Discord.Message} message 
     * @param {string} warning 
     */
    static replyWarning(message, warning) {
        this.replyMessage(message, ":warning: " + warning).then(botMessage => {
            if (!botMessage || botMessage.channel instanceof Discord.DMChannel) return;
            botMessage.client.setTimeout(() => {
                botMessage.delete().catch(console.error)
            }, 15000)
        }).catch(console.error)
    }

    /**
     * Sends a message in the given channel with the given warning text
     * @param {Discord.TextChannel | Discord.DMChannel | Discord.Message} medium 
     * @param {string} warning 
     */
    static sendWarning(medium, warning) {
        this.sendMessage(medium, ":warning: " + warning).then(botMessage => {
            if (!botMessage || botMessage.channel instanceof Discord.DMChannel) return;
            botMessage.client.setTimeout(() => {
                botMessage.delete().catch(console.error)
            }, 15000)
        }).catch(console.error)
    }

    /**
     * Replies to the message with the given error text
     * @param {Discord.Message} message 
     * @param {string} error 
     */
    static async replyError(message, error) {
        this.replyMessage(message, ":stop_sign: " + error).then(botMessage => {
            if (!botMessage || botMessage.channel instanceof Discord.DMChannel) return;
            botMessage.client.setTimeout(() => {
                botMessage.delete().catch(console.error)
            }, 15000)
        }).catch(console.error)
    }

    /**
     * Sends a message in the given channel with the given error text
     * @param {Discord.TextChannel | Discord.DMChannel | Discord.Message} medium 
     * @param {string} error 
     */
    static async sendError(medium, error) {
        this.sendMessage(medium, ":stop_sign: " + error).then(botMessage => {
            if (!botMessage || botMessage.channel instanceof Discord.DMChannel) return;
            botMessage.client.setTimeout(() => {
                botMessage.delete().catch(console.error)
            }, 15000)
        }).catch(console.error)
    }

    /**
     * Replies to the message with a 'could not find' error
     * @param {Discord.Message} message 
     * @param {string} type 
     * @param {string} input 
     * @param {boolean} inObject
     */
    static couldNotFind(message, type, input, inObject) {
        this.replyError(message, `Could not find ${type.toLowerCase()} '${input}'` + (inObject ? ` in this ${inObject}` : ""))
    }

    /**
     * Sends a "pages" message in the given channel
     * @param {Discord.Message} message
     * @param {(Discord.APIMessageContentResolvable | Discord.MessageAdditions | (Discord.MessageOptions & {split?: false;}))[]} pages
     * @param {number} startPage
     */
    static sendPages(message, pages, startPage = 0) {
        let author = message.author
        let guild = message.guild

        pages.forEach((page, index) => {
            if (!page.embed) return;

            page.embed.footer = {
                text: `Page ${index + 1}/${pages.length}`,
                icon_url: author.avatarURL({
                    size: 32,
                    dynamic: true,
                    format: "png"
                })
            }
        })

        let page = startPage
        this.sendMessage(message, pages[page]).then(botMessage => {
            if (!botMessage || pages.length == 1 || botMessage.channel instanceof Discord.DMChannel) return;

            let emojis = ["arrow_backward", "arrow_forward", "previous_track", "next_track"]
            emojis.forEach((name, index) => {
                let emoji = this.getEmoji(guild, name)
                emojis[index] = emoji
                if (!botMessage || botMessage.deleted) return;
                botMessage.react(emoji)
            })

            let collector = botMessage.createReactionCollector((reaction, user) => user.id == author.id, {time: 300000, idle: 30000, dispose: true})

            collector.on("collect", (reaction, user) => {
                if (!botMessage || botMessage.deleted) {
                    collector.stop()
                    return
                };

                reaction.users.remove(user)

                let oldPage = page

                if (this.areEmojisEqual(reaction.emoji, emojis[0])) {
                    page = page - 1 >= 0 ? page - 1 : pages.length - 1

                } else if (this.areEmojisEqual(reaction.emoji, emojis[1])) {
                    page = page + 1 < pages.length ? page + 1 : 0

                } else if (this.areEmojisEqual(reaction.emoji, emojis[2])) {
                    page = 0

                } else if (this.areEmojisEqual(reaction.emoji, emojis[3])) {
                    page = pages.length - 1
                }

                if (page != oldPage) {
                    botMessage.edit(pages[page])
                }
            })

            collector.on("end", () => {
                if (!botMessage || botMessage.deleted) return;
                botMessage.reactions.removeAll()
            })
        }).catch(console.error)
    }

    /**
     * Checks if the member has the given permissions in the guild
     * @param {Discord.GuildMember} member 
     * @param {Array} permissions 
     * @returns {boolean}
     */
    static doesMemberHavePermission(member, permissions = []) {
        try {
            if (member.id == DevId) {
                return true
            }

            let flag = true
            permissions.forEach(permission => {
                if (!flag) return;

                if (permission == "DEV") {
                    if (member.id != DevId) flag = false;
                } else if (permission == "OWNER") {
                    if (member.id != member.guild.ownerID) flag = false;
                } else {
                    flag = member.hasPermission(permission, {checkAdmin: true, checkOwner: true})
                }
            })

            return flag
        } catch(e) {
            console.error(e)
        }
        return false
    }

    /**
     * Checks if the member has the given permissions in the channel
     * @param {Discord.GuildMember} member 
     * @param {Discord.GuildChannel} channel 
     * @param {Array} permissions 
     * @returns {boolean}
     */
    static doesMemberHavePermissionsInChannel(member, channel, permissions = []) {
        try {
            let flag = true
            let memberPermissions = channel.permissionsFor(member)
            permissions.forEach(permission => {
                if (!flag) return;

                flag = memberPermissions.has(permission, true)
            })

            return flag
        } catch(e) {
            console.error(e)
        }
        return false
    }

    /**
     * Gets a member by a member resolvable
     * @param {Discord.Guild} guild
     * @param {Discord.Snowflake | Discord.Message | Discord.User} resolvable
     * @returns {Promise<Discord.GuildMember>} 
     */
    static getMember(guild, resolvable) {
        return guild.members.fetch(resolvable)
    }

    /**
     * Gets a guild by id
     * @param {Discord.Client} client
     * @param {string} id
     * @returns {Promise<Discord.Guild>} 
     */
    static getGuildById(client, id) {
        return client.guilds.fetch(id)
    }

    /**
     * Gets an emoji
     * @param {Discord.Client} client 
     * @param {string} input 
     * @returns {Discord.GuildEmoji?}
     */
    static getEmoji(client, input) {
        let find
        if (Object.values(unicodeEmojis).includes(input)) find = input;
        else find = unicodeEmojis[input];
        if (find) return find;

        client.emojis.cache.forEach(emoji => {
            if (!find && (emoji.name == input || emoji.name == unicodeEmojis[input])) find = emoji;
        })

        return find
    }

    /**
     * Gets an emoji by id
     * @param {Discord.Client} client 
     * @param {string} id 
     * @returns {Discord.GuildEmoji?}
     */
    static getEmojiById(client, id) {
        return client.emojis.cache.get(id)
    }

    /**
     * Checks if all given emojis are similar
     * @param {string | Discord.Emoji} emojis 
     * @returns {boolean}
     */
    static areEmojisEqual(...emojis) {
        emojis.forEach((emoji, index) => {
            if (emoji instanceof Discord.Emoji) {
                emojis[index] = emoji.name
            } else if (typeof emoji == "string") {
                let unicode = unicodeEmojis[emoji]
                if (unicode) emojis[index] = unicode;
            }
        })
        
        return emojis.filter(emoji => emoji == emojis[0]).length == emojis.length
    }

    /**
     * Gets a channel
     * @param {Discord.Guild} guild
     * @param {string} name 
     * @param {string} type
     * @returns {Discord.GuildChannel?} 
     */
    static getChannel(guild, name, type) {
        let find
        guild.channels.cache.forEach(channel => {
            if (!find && channel.name == name
                && (!type || channel.type == type)
                && channel.viewable) find = channel;
        })
        return find
    }

    /**
     * Gets a channel by id
     * @param {Discord.Guild} guild
     * @param {string} id
     * @returns {Discord.GuildChannel?} 
     */
    static getChannelById(guild, id) {
        let channel = guild.channels.cache.get(id)
        if (channel && channel.viewable) return channel;
    }

    /**
     * Gets the channel with highest priority for alerts
     * @param {Discord.Guild} guild
     * @returns {Discord.GuildChannel?} 
     */
    static getPriorityChannel(guild, check) {
        try {
            let channel = this.getChannelById(guild, guild.systemChannelID)
            if (channel && channel.viewable && ((check && check(channel)) || !check)) return channel;
            channel = null
            
            let attemptNames = ["general", "chat", "commons", "discussion", "off-topic", "off-topic-general", "commands", "bot-cmds", "bot-commands", "announcements"]
            attemptNames.forEach(name => {
                if (channel) return;
                channel = this.getChannel(guild, name, "text")
                if (!channel.viewable || (check && !check(channel))) channel = null;
            })
            return channel
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Gets a message from a channel by id
     * @param {Discord.TextChannel} channel
     * @param {string} id
     * @returns {Promise<Discord.Message>} 
     */
    static getMessageInChannel(channel, id) {
        return new Promise((resolve, reject) => {
            if (!channel.viewable) return reject(new Error("Not viewable"));
            channel.messages.fetch().then(messages => {
                let message = messages.get(id)
                if (!message) return reject(new Error("Message does not exist"))
                resolve(message)
            }).catch(reject)
        })
    }

    /**
     * Gets the message before the provided message id
     * @param {Discord.TextChannel} channel
     * @param {string} id
     * @returns {Promise<Discord.Message>} 
     */
    static getPreviousMessage(channel, id) {
        return new Promise((resolve, reject) => {
            if (!channel.viewable) return reject(new Error("Not viewable"));
            channel.messages.fetch({
                limit: 1,
                before: id
            }).then(messages => {
                let message = messages instanceof Discord.Collection ? messages.last() : messages
                resolve(message)
            }).catch(reject)
        })
    }

    /**
     * Checks if one of the provided strings is equal to a recent message in the channel
     * @param {Discord.TextChannel} channel 
     * @param  {...string} text 
     * @returns {Promise<Discord.Message>}
     */
    static getRecentMessage(channel, ...text) {
        return new Promise((resolve, reject) => {
            channel.messages.fetch({limit: 5}).then((messages) => {
                let find
                let recency = 0
                messages.each(message => {
                    if (find) return;
                    if (text.includes(message.content)) {
                        find = message
                        find.recency = recency
                    }
                    recency++
                })
                resolve(find)
            }).catch(reject)
        })
    }

    /**
     * Checks if one of the provided strings is equal to a recent message in the channel
     * @param {Discord.TextChannel} channel 
     * @param  {...string} text 
     * @returns {Promise<Discord.Message>}
     */
    static getRecentMessageContaining(channel, ...text) {
        return new Promise((resolve, reject) => {
            channel.messages.fetch({limit: 5}).then(messages => {
                let find
                let recency = 0
                messages.each(message => {
                    if (find) return;
                    text.forEach(string => {
                        if (find) return;
                        if (message.content.includes(string)) {
                            find = message
                            find.recency = recency
                        }
                    })

                    recency++
                })
                resolve(find)
            }).catch(reject)
        })
    }

    /**
     * Checks if one of the provided strings is equal to a recent message in the channel
     * @param {Discord.TextChannel} channel 
     * @param {Discord.User} user 
     * @param {number} count
     * @param {function?} check
     * @returns {Promise<Discord.Message[]>}
     */
    static getRecentMessagesFrom(channel, user, count = 1, check) {
        return new Promise(async (resolve, reject) => {
            let messages = []
            let cycle = 0
            let leastMessage
            while (messages.length < count) {
                let msgs = await channel.messages.fetch({
                    before: cycle > 0 ? leastMessage.id : null
                })

                if (!msgs || msgs.size == 0) break;

                if (msgs instanceof Discord.Message) {
                    let message = msgs
                    msgs = new Discord.Collection()
                    msgs.set(message.id, message)
                }

                msgs.each(message => {
                    if (messages.length >= count) return;
                    if (!leastMessage || message.createdTimestamp < leastMessage.createdTimestamp) {
                        leastMessage = message
                    }

                    if (message.author.id == user.id && (!check || (check && check(message)))) {
                        messages.push(message)
                    }
                })

                cycle++
            }
            resolve(messages)
        })
    }

    /**
     * Checks if one of the provided strings is equal to a recent message in the channel
     * @param {Discord.TextChannel} channel 
     * @param {Discord.User} user 
     * @param {number} timestamp
     * @param {function?} check
     * @returns {Promise<Discord.Message[]>}
     */
     static getRecentMessagesAfter(channel, user, timestamp, check) {
        return new Promise(async (resolve, reject) => {
            let messages = []
            let cycle = 0
            let leastMessage
            while (true) {
                let msgs = await channel.messages.fetch({
                    before: cycle > 0 ? leastMessage.id : null
                })

                if (!msgs || msgs.size == 0) break;

                if (msgs instanceof Discord.Message) {
                    let message = msgs
                    msgs = new Discord.Collection()
                    msgs.set(message.id, message)
                }

                let flag = false
                msgs.each(message => {
                    if (message.createdTimestamp < timestamp) {
                        flag = true
                        return
                    }
                    if (!leastMessage || message.createdTimestamp < leastMessage.createdTimestamp) {
                        leastMessage = message
                    }

                    if (message.author.id == user.id && (!check || (check && check(message)))) {
                        messages.push(message)
                    }
                })
                if (flag) break;

                cycle++
            }
            resolve(messages)
        })
    }

    /**
     * Checks if message1 is more recent than message2
     * @param {Discord.Message} message1 
     * @param  {Discord.Message} message2
     * @returns {boolean}
     */
    static isMessageMoreRecent(message1, message2) {
        return message1.createdTimestamp - message2.createdTimestamp > 0
    }

    /**
     * Gets a standard embed footer object
     * @param {Discord.Client} client 
     * @returns {Object}
     */
    static getFooter(client) {
        const onlineFor = (Date.now() - client.startTime) / 1000

        return {
            text: `Uptime: ${Math.floor(onlineFor / 3600)}h ${Math.floor((onlineFor / 60) % 60)}m ${Math.floor(onlineFor % 60)}s | Copyright ${(new Date()).getUTCFullYear()} © All rights reserved.`
        }
    }

    /**
     * Gets a role
     * @param {Discord.Guild} guild
     * @param {string} name 
     * @returns {Promise<Discord.GuildChannel>} 
     */
    static getRole(guild, name) {
        return new Promise((resolve, reject) => {
            guild.roles.fetch().then(roles => {
                let find
                roles.cache.each(role => {
                    if (!find && role.name == name) find = role;
                })
                resolve(find)
            }).catch(reject)
        })
    }

    /**
     * Gets a channel by id
     * @param {Discord.Guild} guild
     * @param {string} id
     * @returns {Promise<Discord.Role>} 
     */
    static getRoleById(guild, id) {
        return guild.roles.fetch(id)
    }

    /**
     * Parses the provided input to find a channel
     * @param {Discord.Guild} guild
     * @param {string} input
     * @returns {Discord.GuildChannel} 
     */
    static parseChannel(guild, input) {
        input = input.replace(/^<#/, "").replace(/>$/, "")
        let find = this.getChannelById(guild, input)
        if (find) return find;
        return this.getChannel(guild, input)
    }

    /**
     * Parses the provided input to find an emoji
     * @param {Discord.Client} client
     * @param {string} input
     * @returns {Discord.GuildEmoji | Discord.ReactionEmoji | Discord.Emoji} 
     */
    static parseEmoji(client, input) {
        input = input.replace(/^<:.+:/, "").replace(/>$/, "")
        let find = this.getEmojiById(client, input)
        if (find) return find;
        return this.getEmoji(client, input)
    }

    /**
     * Parses the provided input to find a role
     * @param {Discord.Guild} guild
     * @param {string} input
     * @returns {Promise<Discord.Role>} 
     */
    static async parseRole(guild, input) {
        input = input.replace(/^<@&/, "").replace(/>$/, "")
        return new Promise((resolve, reject) => {
            this.getRoleById(guild, input).then(find => {
                if (find) return resolve(find);
                this.getRole(guild, input).then(find => {
                    return resolve(find);
                }).catch(reject)
            }).catch(reject)
        })
    }

    /**
     * Parses the provided input and creates a new Date object
     * @param {string} input
     * @returns {Date} 
     */
    static parseDate(input) {
        let number = Number(input)
        let date = !isNaN(number) ? new Date(number) : new Date(input)
        return isNaN(date) ? null : date
    }
}

module.exports = Util