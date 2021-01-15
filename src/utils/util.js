const Discord = require("discord.js")
const HTTPS = require("https")
const HTTP = require("http")
const FileSystem = require("fs");

const unicodeEmojis = require("./unicodeEmojis.json")
const DevId = "255733848162304002"

class util {
    constructor() {
        console.error(`The ${this.constructor.name} class cannot be constructed.`);
    }

    /**
     * Gets the ping between the bot and discord relative to the time the message was created
     * @param {Discord.Message} message A recently recieved discord message
     * @return {number}
     */
    static ping(message) {
        const date = new Date();
        return date.getUTCMilliseconds() - message.createdAt.getUTCMilliseconds()
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
     * @param {string | Object} options The request options
     * @param {Function} callback A function that is called when a response is received
     */
    static request(options, callback) {
        const isUrl = typeof options == "string"
        const method = isUrl ? (options.toLowerCase().slice(0, 5) == "https" ? HTTPS : HTTP) : HTTPS

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

        if (!isUrl) req.end();
    }

    /**
     * Sends a request to the given request options
     * @param {string | Object} options The request options
     * @returns {Promise<string>} A promise that resolves with the response
     */
    static requestAsync(options) {
        return new Promise((resolve, reject) => {
            const isUrl = typeof options == "string"
            const method = isUrl ? (url.toLowerCase().slice(0, 5) == "https" ? HTTPS : HTTP) : HTTPS

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

            if (!isUrl) req.end();
        })
    }

    /**
     * Loads .js files from the given directory
     * @param {string} dir Directory to the folder that holds all the modules to be loaded
     * @param {Function} register A function that is called that registers the modules into the Collection
     * @returns {Collection} A collection that contains all of the loaded modules
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

    /**
     * Replies to the message with the given text, includes error handling
     * @param {Discord.Message} message 
     * @param {string} text 
     */
    static async replyMessage(message, text) {
        try {
            await message.reply("\n" + text)
        } catch(e) {
            console.error(e)
            this.sendMessage(message.author.dmChannel, ":stop_sign: Failed to reply with message in guild, " + text)
        }
    }

    /**
     * Sends a message in the given channel, includes error handling
     * @param {Discord.TextChannel} channel 
     * @param {string} text 
     */
    static async sendMessage(channel, text) {
        try {
            await channel.send(text)
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Replies to the message with the given warning text
     * @param {Discord.Message} message 
     * @param {string} warning 
     */
    static async replyWarning(message, warning) {
        try {
            let botMessage = await message.reply("\n:warning: " + warning)
            botMessage.delete({
                timeout: 15000
            })
        } catch(e) {
            console.error(e)
            this.sendMessage(message.author.dmChannel, ":warning: Failed to reply with warning in guild, " + warning)
        }
    }

    /**
     * Sends a message in the given channel with the given warning text
     * @param {Discord.TextChannel} channel 
     * @param {string} warning 
     */
    static async sendWarning(channel, warning) {
        try {
            let botMessage = await channel.send(":warning: " + warning)
            botMessage.delete({
                timeout: 15000
            })
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Replies to the message with the given error text
     * @param {Discord.Message} message 
     * @param {string} error 
     */
    static async replyError(message, error) {
        try {
            let botMessage = await message.reply("\n:stop_sign: " + error)
            botMessage.delete({
                timeout: 15000
            })
        } catch(e) {
            console.error(e)
            this.sendMessage(message.author.dmChannel, ":stop_sign: Failed to reply with error in guild, " + error)
        }
    }

    /**
     * Sends a message in the given channel with the given error text
     * @param {Discord.TextChannel} channel 
     * @param {string} error 
     */
    static async sendError(channel, error) {
        try {
            let botMessage = await channel.send(":stop_sign: " + error)
            botMessage.delete({
                timeout: 15000
            })
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Replies to the message with a 'could not find' error
     * @param {Discord.Message} message 
     * @param {string} type 
     * @param {string} input 
     * @param {boolean} inObject
     */
    static couldNotFind(message, type, input, inObject) {
        this.replyError(message, `Could not find ${type.toLowerCase()} '${input}'` + (inObject ? `in this ${inObject}` : ""))
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
     * @param {Discord.Message | Discord.User} resolvable
     * @returns {Promise<Discord.GuildMember>} 
     */
    static getMember(guild, resolvable) {
        try {
            return guild.members.fetch(resolvable)
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Gets a guild by id
     * @param {Discord.Client} client
     * @param {string} id
     * @returns {Promise<Discord.Guild>} 
     */
    static getGuildById(client, id) {
        try {
            return client.guilds.fetch(id)
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Gets an emoji
     * @param {Discord.Guild} guild 
     * @param {string} input 
     * @returns {Discord.GuildEmoji}
     */
    static getEmoji(guild, input) {
        try {
            let find

            Object.values(unicodeEmojis).forEach(unicode => {
                if (!find && unicode == input) find = unicode;
            })

            Object.keys(unicodeEmojis).forEach(name => {
                if (!find && name == input) find = unicodeEmojis[name];
            })

            guild.emojis.cache.forEach(emoji => {
                if (!find && emoji.name == input) find = emoji;
            })

            guild.client.emojis.cache.forEach(emoji => {
                if (!find && emoji.name == input) find = emoji;
            })

            return find
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Gets an emoji by id
     * @param {Discord.Guild} guild 
     * @param {string} id 
     * @returns {Discord.GuildEmoji}
     */
    static getEmojiById(guild, id) {
        try {
            return guild.emojis.cache.get(id) ? guild.emojis.cache.get(id) : guild.client.emojis.cache.get(id)
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Gets a channel
     * @param {Discord.Guild} guild
     * @param {string} name 
     * @param {string} type
     * @returns {Discord.GuildChannel?} 
     */
    static getChannel(guild, name, type) {
        try {
            let find
            guild.channels.cache.forEach(channel => {
                if (!find && channel.name == name
                    && (!type || channel.type == type)
                    && channel.viewable) find = channel;
            })
            return find
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Gets a channel by id
     * @param {Discord.Guild} guild
     * @param {string} id
     * @returns {Discord.GuildChannel?} 
     */
    static getChannelById(guild, id) {
        try {
            let channel = guild.channels.cache.get(id)
            if (channel && channel.viewable) return channel;
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Gets the channel with highest priority for alerts
     * @param {Discord.Guild} guild
     * @returns {Discord.GuildChannel?} 
     */
    static getPriorityChannel(guild) {
        try {
            let channel = guild.systemChannel
            if (channel.viewable) return channel;
            channel = null
            
            ["general", "commons", "announcements", "commands", "bot-cmds", "bot-commands"].forEach(name => {
                if (channel) return;
                channel = this.getChannel(guild, name, "text")
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
     * @returns {Promise<Discord.Message>?} 
     */
    static async getMessageInChannel(channel, id) {
        try {
            if (!channel.viewable) return;
            let messages = await channel.messages.fetch()
            return messages.get(id)
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Gets the message before the provided message id
     * @param {Discord.TextChannel} channel
     * @param {string} id
     * @returns {Promise<Discord.Message>?} 
     */
    static async getPreviousMessage(channel, id) {
        try {
            if (!channel.viewable) return;
            let messages = await channel.messages.fetch({
                limit: 1,
                before: id
            })
            return messages instanceof Discord.Collection ? messages.last() : messages
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Checks if one of the provided strings is equal to a recent message in the channel
     * @param {Discord.TextChannel} channel 
     * @param  {...string} text 
     * @returns {Promise<Discord.Message>}
     */
    static async getRecentMessage(channel, ...text) {
        let msg

        try {
            let messages = await channel.messages.fetch({limit: 5})
            let recency = 0
            messages.forEach(message => {
                if (msg) return;
                if (text.includes(message.content)) {
                    msg = message
                    msg.recency = recency
                }

                recency++
            })
        } catch(e) {
            console.error(e)
        }
        return msg
    }

    /**
     * Checks if message1 is more recent than message2
     * @param {Discord.Message} message1 
     * @param  {Discord.Message} message2
     * @returns {boolean}
     */
    static isMessageMoreRecent(message1, message2) {
        return message1.createdAt.getTime() - message2.createdAt.getTime() > 0
    }

    /**
     * Gets a role
     * @param {Discord.Guild} guild
     * @param {string} name 
     * @returns {Promise<Discord.GuildChannel>} 
     */
    static async getRole(guild, name) {
        try {
            let find
            let roles = await guild.roles.fetch()
            roles.cache.forEach(role => {
                if (!find && role.name == name) find = role;
            })
            return find
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Gets a channel by id
     * @param {Discord.Guild} guild
     * @param {string} id
     * @returns {Promise<Discord.Role>} 
     */
    static getRoleById(guild, id) {
        try {
            return guild.roles.fetch(id)
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Parses the provided input to find a channel
     * @param {Discord.Guild} guild
     * @param {string} input
     * @returns {Discord.GuildChannel} 
     */
    static parseChannel(guild, input) {
        try {
            input = input.replace(/^<#/, "").replace(/>$/, "")

            let find = this.getChannelById(guild, input)
            if (find) return find;
            return this.getChannel(guild, input)
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Parses the provided input to find an emoji
     * @param {Discord.Guild} guild
     * @param {string} input
     * @returns {Discord.GuildEmoji} 
     */
    static parseEmoji(guild, input) {
        try {
            input = input.replace(/^<:.+:/, "").replace(/>$/, "")

            let find = this.getEmojiById(guild, input)
            if (find) return find;
            return this.getEmoji(guild, input)
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Parses the provided input to find a role
     * @param {Discord.Guild} guild
     * @param {string} input
     * @returns {Promise<Discord.Role>} 
     */
    static async parseRole(guild, input) {
        try {
            input = input.replace(/^<@&/, "").replace(/>$/, "")

            let find = await this.getRoleById(guild, input)
            if (find) return find;
            return this.getRole(guild, input)
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Parses the provided input and creates a new Date object
     * @param {string} input
     * @returns {Date} 
     */
    static parseDate(input) {
        try {
            let number = Number(input)
            let date = !isNaN(number) ? new Date(number) : new Date(input)

            return isNaN(date) ? null : date
        } catch(e) {
            console.error(e)
        }
    }
}

module.exports = util