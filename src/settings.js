const discord = require("discord.js")
const fs = require("fs")

class Settings {
    constructor(guild) {
        this.guild = guild
        this.settings = new discord.Collection()

        fs.readdir(`${__dirname}/models`, (error, files) => {
            if (error) console.error(error);

            const jsfiles = files.filter(file => file.split(".").pop() == "js")

            if (jsfiles.length === 0) return;

            jsfiles.forEach(file => {
                let name = file.split(".").shift().toLowerCase()
                let setting = require(`./models/${file}`)
                this.settings.set(name, setting)
            })
        })

        console.log(`Made settings for guild ${guild.id}`)
    }

    /**
     * Checks if a setting exists
     * @param {string} name 
     */
    isSetting(name) {
        if (!this.settings.has(name)) console.error(`No setting called '${name}' exists`);
    }

    /**
     * Checks if a setting has a default value
     * @param {Object} setting 
     * @param {string} name 
     */
    hasDefault(setting, name) {
        if (!Object.keys(setting).includes("defaultValue")) console.error(`Setting '${name}' does not have a defaultValue`);
    }

    /**
     * Get a setting's value
     * @param {string} name 
     */
    async getSetting(name) {
        this.isSetting(name)

        const setting = this.settings.get(name)
        const model = setting.model
        let data = await model.findOne({
            GuildID: this.guild.id
        })

        if (!data) {
            this.hasDefault(setting, name)

            data = new model({
                Value: setting.jsonFormatted ? JSON.stringify(setting.defaultValue) : setting.defaultValue,
                GuildID: this.guild.id
            })
            data.save()
        }

        return setting.jsonFormatted ? JSON.parse(data.Value) : data.Value
    }

    /**
     * Set a setting's value
     * @param {string} name 
     * @param {*} value 
     */
    async setSetting(name, value) {
        this.isSetting(name)

        const setting = this.settings.get(name)
        const model = setting.model
        let data = await model.findOne({
            GuildID: this.guild.id
        })

        if (data) {
            await model.findOneAndDelete({
                GuildID: this.guild.id
            })
        }

        data = new model({
            Value: setting.jsonFormatted ? JSON.stringify(value) : value,
            GuildID: this.guild.id
        })
        data.save()
    }

    /**
     * Sets a setting's value to the returned value of the transform
     * @param {string} name 
     * @param {Function} transform 
     */
    async editSetting(name, transform) {
        this.isSetting(name)

        const setting = this.settings.get(name)
        const model = setting.model
        let data = await model.findOne({
            GuildID: this.guild.id
        })

        if (!data) {
            this.hasDefault(setting, name)

            data = new model({
                Value: setting.jsonFormatted ? JSON.stringify(setting.defaultValue) : setting.defaultValue,
                GuildID: this.guild.id
            })
        }

        let newValue = await transform(setting.jsonFormatted ? JSON.parse(data.Value) : data.Value)
        newValue = setting.jsonFormatted ? JSON.stringify(newValue) : newValue

        if (!newValue || data.Value == newValue) return;

        await model.findOneAndDelete({
            GuildID: this.guild.id
        })

        data = new model({
            Value: newValue,
            GuildID: this.guild.id
        })
        data.save()
    }
}

module.exports = Settings;