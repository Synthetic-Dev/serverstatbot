const discord = require("discord.js")
const fs = require("fs")

const defaults = require("./defaults.json")

class Settings {
    constructor(guild) {
        this.guild = guild
        this.settings = new discord.Collection()

        fs.readdir(`${__dirname}/models`, (error, files) => {
            if (error) console.error(error);

            const jsfiles = files.filter(file => file.split(".").pop() == "js")

            if (jsfiles.length === 0) return console.log(`No model files`);

            jsfiles.forEach(file => {
                let name = file.toLowerCase()
                if (!defaults[name]) return console.warn(`Model ${file} does not have a default, setting not registered`);
                let model = require(`./models/${file}`)
                this.settings.set(name, model)
            })
        })
    }

    isSetting(name) {
        if (!this.settings.has(name)) console.error(`No model for a settings called '${name}' exists`);
    }

    async getSetting(name) {
        isSetting(name)

        const model = this.settings.get(name)
        let data = await model.findOne({
            GuildID: this.guild
        })

        if (!data) {
            data = new model({
                Value: defaults[name],
                GuildID: this.guild
            })
            data.save()
        }

        return data.Value
    }

    async setSetting(name, value) {
        isSetting(name)

        const model = this.settings.get(name)
        let data = await model.findOne({
            GuildID: this.guild
        })

        if (data) {
            await model.findOneAndRemove({
                GuildID: this.guild
            })

            data = new model({
                Value: value,
                GuildID: this.guild
            })
            data.save()
        } else {
            data = new model({
                Value: defaults[name],
                GuildID: this.guild
            })
            data.save()
        }
    }
}

module.exports = Settings;