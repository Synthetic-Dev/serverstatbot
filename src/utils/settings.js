const Discord = require("discord.js")
const FileSystem = require("fs")

class Settings {
    constructor(path, queryFilter = () => {return {}}, optionsFilter = (n, v) => {return v}) {
        this.queryFilter = queryFilter
        this.optionsFilter = optionsFilter

        this.settings = new Discord.Collection()
        this.cache = new Discord.Collection()
        this.loading = true

        FileSystem.readdir(`${__dirname}/../${path}`, (error, files) => {
            if (error) return console.error(error);

            const jsfiles = files.filter(file => file.split(".").pop() == "js")
            if (jsfiles.length == 0) return;

            jsfiles.forEach(file => {
                let name = file.split(".").shift().toLowerCase()
                let setting = require(`..${path}/${file}`)
                this.settings.set(name, setting)
            })
        })

        this.loading = false
    }

    /**
     * Checks if a setting exists
     * @param {string} name 
     */
    isSetting(name) {
        while (this.loading) {}
        if (!this.settings.has(name)) throw new Error(`No setting model called '${name}' exists`);
    }

    /**
     * Get a setting's value
     * @param {string} name
     * @returns {*}
     */
    async getSetting(name) {
        this.isSetting(name)

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
    setSetting(name, value) {
        this.isSetting(name)
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
        })
    }

    /**
     * Sets a setting's value to the returned value of the transform
     * @param {string} name 
     * @param {Function} transform 
     */
    editSetting(name, transform) {
        this.isSetting(name)

        this.getSetting(name).then(oldValue => {
            Promise.resolve(transform(oldValue)).then(newValue => {
                if (newValue === oldValue) return;
                this.setSetting(name, newValue)
            })
        })
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