const Discord = require("discord.js")
const FileSystem = require("fs")

const modelPaths = ["/models/global", "/models/guild"]
const models = {}

modelPaths.forEach(path => {
    models[path] = {
        collection: new Discord.Collection(),
        loaded: false
    }

    FileSystem.readdir(`${__dirname}/../${path}`, (error, files) => {
        if (error) return console.error(error);

        const jsfiles = files.filter(file => file.split(".").pop() == "js")
        if (jsfiles.length == 0) return;

        jsfiles.forEach(file => {
            let name = file.split(".").shift()
            let setting = require(`..${path}/${file}`)
            models[path].collection.set(name, setting)
        })

        models[path].loaded = true
    })
})

class Settings {
    constructor(path, queryFilter = () => {return {}}, optionsFilter = (n, v) => {return v}) {

        this.queryFilter = queryFilter
        this.optionsFilter = optionsFilter

        this.models = models[path]
        this.settings = models[path].collection
        this.cache = new Discord.Collection()
    }

    /**
     * Checks if a setting exists
     * @param {string} name 
     */
    async isSetting(name) {
        while (!this.models.loaded) await new Promise(resolve => setTimeout(resolve, 1000));
        if (!this.settings.has(name)) throw new Error(`No setting model called '${name}' exists`);
    }

    /**
     * Get a setting's value
     * @param {string} name
     * @returns {*}
     */
    async get(name) {
        await this.isSetting(name)

        if (process.env.ISDEV == "TRUE") {
            if (name == "prefix") return "--";
        }

        let cachedValue = this.cache.get(name)
        if (cachedValue) return cachedValue;

        const setting = this.settings.get(name)
        let data = await setting.findOne(this.queryFilter(name))

        if (!data) {
            let options = this.optionsFilter(name, {})
            data = new setting(options)
            data.save()
        }

        return data.Value
    }

    /**
     * Set a setting's value
     * @param {string} name 
     * @param {*} value 
     */
    async set(name, value) {
        await this.isSetting(name)
        this.cache.set(name, value)

        const setting = this.settings.get(name)
        const filter = this.queryFilter(name)
        setting.findOne(filter).then(async data => {
            if (data) {
                data.Value = value
            } else {
                let options = this.optionsFilter(name, {Value: value})
                data = new setting(options)
            }

            data.save()
        }).catch(console.error)
    }

    /**
     * Sets a setting's value to the returned value of the transform
     * @param {string} name 
     * @param {Function} transform 
     */
    async update(name, transform) {
        await this.isSetting(name)

        this.get(name).then(oldValue => {
            Promise.resolve(transform(oldValue)).then(newValue => {
                this.set(name, newValue)
            }).catch(console.error)
        }).catch(console.error)
    }

    /**
     * Removes all settings from cache and database
     */
    clear() {
        this.cache.clear()
        this.settings.each((setting, name) => {
            setting.findOneAndDelete(this.queryFilter(name))
        })
    }
}

class GuildSettings extends Settings {
    constructor(guild) {
        super("/models/guild", 
        
        () => {
            return {GuildID: guild.id}
        }, 

        (name, options) => {
            options.GuildID = guild.id;
            return options
        })

        this.guild = guild
    }
}

class GlobalSettings extends Settings {
    constructor() {
        super("/models/global",
        
        (name) => {
            return {_name: name}
        },
        
        (name, options) => {
            options._name = name;
            return options
        })
    }
}

module.exports = {
    Guild: GuildSettings,
    Global: GlobalSettings
};