const discord = require("discord.js")
const https = require("https")
const http = require("http")
const fs = require("fs");

class util {
    constructor() {
        console.error(`The ${this.constructor.name} class cannot be constructed.`);
    }

    /**
     * Loads .js files from the given directory
     * @param {string} dir 
     * @param {discord.Client} dir 
     * @returns {Collection}
     */
    static loadmodules(dir, client = null) {
        const modules = new discord.Collection()

        fs.readdir(`${__dirname}/${dir}`, (error, files) => {
            if (error) console.error(error);

            const jsfiles = files.filter(file => file.split(".").pop() == "js")

            if (jsfiles.length === 0) return console.log(`No .js files to load at ${dir}`);

            jsfiles.forEach(file => {
                let Module = require(`./${dir}/${file}`)
                let module = new Module(client)
                let aliases = module.aliases && module.aliases()

                modules.set(module.name(true), module)

                if (aliases) {
                    for (let alias of aliases) {
                        modules.set(alias.toLowerCase(), module)
                    }
                }
            })
        })

        return modules
    }

    /**
     * Gets a channel
     * @param {discord.GuildChannelManager} channels
     * @param {string} name 
     * @param {string} type
     * @returns {discord.GuildChannel} 
     */
    static getChannel(channels, name, type = "text") {
        let find

        channels.cache.forEach(channel => {
            if (!find && channel.name == name && channel.type == type && !channel.deleled) {
                find = channel
            }
        })

        return find
    }

    static doesUserHavePermission(user, permissions = []) {
        let flag = true

        permissions.forEach(permission => {
            if (permission == "OWNER" && user.id != message.guild.ownerID) flag = false;
            else if (typeof(permission) == "number" && user.id != permission) flag = false;
            else if (!user.hasPermission(permission, {checkAdmin: true, checkOwner: true})) flag = false;
        })

        return flag
    }


    static request(url, secure, callback) {
        (secure && https || http).get(url, response => {
            let data = ""

            response.on("data", chunk => {
                data += chunk
            })

            response.on("end", () => {
                callback(true, data)
            })
        }).on("error", error => {
            callback(false, error)
        })
    }

    static ping(message) {
        const date = new Date();
        return date.getTime() - message.createdAt.getTime()
    }
}

module.exports = util