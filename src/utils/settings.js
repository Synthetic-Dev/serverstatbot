const Mongoose = require("mongoose")
const Discord = require("discord.js")
const NodeCache = require("node-cache")
const FileSystem = require("fs")

const MODELS = {
    collection: new Discord.Collection(),
    loaded: false,
}

FileSystem.readdir(`${__dirname}/../models/guild`, async (error, files) => {
    if (error) return console.error(error)

    const jsfiles = files.filter((file) => file.split(".").pop() == "js")
    if (jsfiles.length == 0) return

    console.log("[Settings] Loading models")

    jsfiles.forEach((file) => {
        let name = file.split(".").shift()
        let setting = require(`../models/guild/${file}`)

        MODELS.collection.set(name, setting)
    })

    MODELS.loaded = true
})

class GuildSettings {
    constructor(guild) {
        this.guild = guild

        this.models = MODELS
        this.settings = this.models.collection
        this.transactions = {}
        this.cache = new NodeCache({
            checkperiod: 0,
            useClones: false,
        })
    }

    /**
     * Checks if a setting exists
     * @param {string} name
     */
    async isSetting(name) {
        while (!this.models.loaded)
            await new Promise((resolve) => setTimeout(resolve, 1000))
        if (!this.settings.has(name))
            throw new Error(`No setting model called '${name}' exists`)
    }

    /**
     * Get multiple setting documents
     * @param {string} name
     * @param {Mongoose.FilterQuery}
     * @returns {Mongoose.Document}
     */
    async search(name, query) {
        await this.isSetting(name)

        const setting = this.settings.get(name)
        let model = setting

        if (this.models.single)
            throw new Error("Cannot search through singleton setting")
        return await model.find(query)
    }

    /**
     * Get a setting's document
     * @param {string} name
     * @param {string} key
     * @returns {Mongoose.Document}
     */
    async get(name, key = null) {
        await this.isSetting(name)
        while (this.transactions[name])
            await new Promise((resolve) => setTimeout(resolve, 1000))

        let cachedData = this.cache.get(name)
        if (cachedData) {
            if (key) return cachedData[key]
            return cachedData
        }

        const setting = this.settings.get(name)

        this.transactions[name] = true
        let data = await setting.findOne({ _guildId: this.guild.id })

        if (!data) {
            data = new setting({ _guildId: this.guild.id })
            data.save()
        }

        this.cache.set(name, data)
        delete this.transactions[name]

        if (key) return data[key]
        return data
    }

    /**
     * Set a setting's document value(s)
     * @param {string} name
     * @param {Mongoose.Document | *} value
     * @param {string} key
     */
    async set(name, value, key = null) {
        await this.isSetting(name)
        while (this.transactions[name])
            await new Promise((resolve) => setTimeout(resolve, 1000))

        if (!key) {
            if (!(value instanceof Mongoose.Document))
                throw new Error(`Tried setting '${name}' to non-document value`)

            this.transactions[name] = true

            value
                .save()
                .catch(console.error)
                .finally(() => {
                    this.cache.set(name, value)
                    delete this.transactions[name]
                })
            return
        }

        let cachedData = this.cache.get(name)
        if (cachedData && cachedData[key] === value) return

        this.transactions[name] = true

        const setting = this.settings.get(name)
        setting
            .findOne({ _guildId: this.guild.id })
            .then((data) => {
                if (data) {
                    data[key] = value
                } else {
                    let options = { _guildId: this.guild.id }
                    options[key] = value
                    data = new setting(options)
                }

                data.save()
                    .catch(console.error)
                    .finally(() => {
                        this.cache.set(name, data)
                        delete this.transactions[name]
                    })
            })
            .catch((err) => {
                console.error(err)
                delete this.transactions[name]
            })
    }

    /**
     * Sets a setting's document to the returned value of the transform
     * @param {string} name
     * @param {Function} transform
     */
    async update(name, transform) {
        await this.isSetting(name)

        this.get(name)
            .then((oldData) => {
                Promise.resolve(transform(oldData))
                    .then((newData) => {
                        this.set(name, newData)
                    })
                    .catch(console.error)
            })
            .catch(console.error)
    }

    /**
     * Removes all settings from cache and database
     */
    clear() {
        console.log(
            `[Settings] Deleting (${this.guild.id}) ${this.guild.name} documents`
        )
        this.cache.flushAll()
        this.settings.each(async (setting, name) => {
            await setting.deleteMany({ _guildId: this.guild.id })
        })
    }

    /**
     * Removes all data from guilds that the bot is no longer in
     * @param {Discord.Collection} guilds
     */
    static async cleanup(guilds) {
        while (!MODELS.loaded)
            await new Promise((resolve) => setTimeout(resolve, 1000))

        console.log("[Settings] Cleanup started")

        let guildIds = []
        guilds.forEach((guild) => {
            guildIds.push(guild.id)
        })

        MODELS.collection.forEach(async (setting, name) => {
            let result = await setting
                .deleteMany()
                .where("_guildId")
                .nin(guildIds)
                .where("GuildID")
                .nin(guildIds)
                .exec()
            console.log(
                `[Settings] Deleted ${result.deletedCount} unused documents from '${name}' collection`
            )
        })
    }
}

class GlobalSettings {
    constructor() {
        this.model = require(`../models/global.js`)
        this.transactions = {}
        this.cache = new NodeCache({
            checkperiod: 0,
            useClones: true,
        })
    }

    /**
     * Checks if a global setting exists
     * @param {string} name
     */
    isSetting(name) {
        if (!this.model.schema.obj[name])
            throw new Error(`No global setting called '${name}' exists`)
    }

    /**
     * Get a global setting's value
     * @param {string} name
     * @returns {*}
     */
    async get(name) {
        this.isSetting(name)
        while (this.transactions[name])
            await new Promise((resolve) => setTimeout(resolve, 1000))

        let cachedValue = this.cache.get(name)
        if (cachedValue) return cachedValue

        this.transactions[name] = true
        let data = await this.model.findOne()

        if (!data) {
            data = new this.model()
            data.save()
        }

        this.cache.set(name, data[name])
        delete this.transactions[name]

        return data[name]
    }

    /**
     * Set a global setting's value
     * @param {string} name
     * @param {*} value
     */
    async set(name, value) {
        this.isSetting(name)
        while (this.transactions[name])
            await new Promise((resolve) => setTimeout(resolve, 1000))

        let cachedValue = this.cache.get(name)
        if (cachedValue === value) return

        this.transactions[name] = true

        this.model
            .findOne()
            .then(async (data) => {
                if (data) {
                    data[name] = value
                } else {
                    let options = {}
                    options[name] = value
                    data = new this.model(options)
                }

                data.save()
                this.cache.set(name, value)
            })
            .catch(console.error)
            .finally(() => {
                delete this.transactions[name]
            })
    }

    /**
     * Sets a global setting's value to the returned value of the transform
     * @param {string} name
     * @param {Function} transform
     */
    async update(name, transform) {
        this.isSetting(name)

        this.get(name)
            .then((oldValue) => {
                Promise.resolve(transform(oldValue))
                    .then((newValue) => {
                        this.set(name, newValue)
                    })
                    .catch(console.error)
            })
            .catch(console.error)
    }

    /**
     * Removes all settings from cache and database
     */
    clear() {
        this.cache.flushAll()
        this.model
            .deleteMany()
            .then(() => {
                console.log(`[Settings] Deleted global document`)
            })
            .catch((e) => {
                console.error(
                    `[Settings] Error while deleting global settings: ${e}`
                )
            })
    }
}

module.exports = {
    Guild: GuildSettings,
    Global: GlobalSettings,
}
