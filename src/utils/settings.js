const Mongoose = require("mongoose")
const Discord = require("discord.js")
const NodeCache = require("node-cache")
const FileSystem = require("fs")

const MODELS = {
    collection: new Discord.Collection(),
    loaded: false
}

FileSystem.readdir(`${__dirname}/../models/guild`, (error, files) => {
    if (error) return console.error(error);

    const jsfiles = files.filter(file => file.split(".").pop() == "js")
    if (jsfiles.length == 0) return;

    jsfiles.forEach(file => {
        let name = file.split(".").shift()
        let setting = require(`../models/guild/${file}`)
        MODELS.collection.set(name, setting)
    })

    MODELS.loaded = true
})

class Settings {
    constructor(options = {
        queryFilter: () => {return {}},
        optionsFilter: (_, v) => {return v}
    }) {

        this.queryFilter = options.queryFilter
        this.optionsFilter = options.optionsFilter

        this.models = options.singleModel ? options.singleModel : options.models
        this.settings = this.models.collection
        this.cache = new NodeCache({
            checkperiod: 0
        })
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

        let cachedValue = this.cache.get(name)
        if (cachedValue) return cachedValue;

        const setting = this.settings.get(name)
        let model = setting;

        if (this.models.single) {
            if (setting.constant) return setting.schema.Value;
            model = this.models.model
        }

        let data = await model.findOne(this.queryFilter(name))

        if (!data) {
            let options = this.optionsFilter(name, {})
            data = new model(options)
            data.save()
        }

        this.cache.set(name, data.Value)
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
        let model = setting;

        if (this.models.single) {
            if (setting.constant) throw new Error(`Constant '${name}' cannot be changed`);
            model = this.models.model
        }

        model.findOne(this.queryFilter(name)).then(async data => {
            if (data) {
                data.Value = value
            } else {
                let options = this.optionsFilter(name, {Value: value})
                data = new model(options)
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
        this.cache.flushAll()
        this.settings.each((setting, name) => {
            let model = setting
            if (this.models.single) {
                model = this.models.model
            }

            model.deleteMany(this.queryFilter(name))
        })
    }
}

class GuildSettings extends Settings {
    constructor(guild) {
        super({
            models: MODELS,
            queryFilter: () => {
                return {GuildID: guild.id}
            }, 
            optionsFilter: (_, options) => {
                options.GuildID = guild.id;
                return options
            }
        })

        this.guild = guild
    }

    /**
     * Removes all data from guilds that the bot is no longer in
     * @param {Discord.Collection} guilds
     */
    static async cleanup(guilds) {
        while (!MODELS.loaded) await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("Cleanup started")

        let guildIds = []
        guilds.forEach(guild => {
            guildIds.push(guild.id)
        })

        MODELS.collection.forEach(async (setting, name) => {
            let result = await setting.deleteMany().where("GuildID").nin(guildIds).exec()
            console.log(`Deleted ${result.deletedCount} unused documents from '${name}' collection`)
        })
    }
}

class GlobalSettings extends Settings {
    constructor() {
        const Schema = new Mongoose.Schema({
            _name: {
                type: String
            },
            Value: ""
        })

        const singleModel = {
            single: true,
            loaded: false,
            model: Mongoose.model("globals", Schema),
            collection: new Discord.Collection()
        }

        FileSystem.readdir(`${__dirname}/../models/global`, (error, files) => {
            if (error) return console.error(error);
        
            const jsfiles = files.filter(file => file.split(".").pop() == "js")
            if (jsfiles.length == 0) return;
        
            jsfiles.forEach(file => {
                let name = file.split(".").shift()
                let setting = require(`../models/global/${file}`)
                singleModel.collection.set(name, setting)
            })
        
            singleModel.loaded = true
        })

        super({
            singleModel: singleModel,
            queryFilter: (name) => {
                return {_name: name}
            },
            optionsFilter: (name, options) => {
                options._name = name;
                return options
            }
        })
    }
}

module.exports = {
    Guild: GuildSettings,
    Global: GlobalSettings
};