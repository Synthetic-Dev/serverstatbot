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

    isSetting(name) {
        if (!this.settings.has(name)) console.error(`No setting called '${name}' exists`);
    }

    hasDefault(setting) {
        if (!setting.defaultValue) console.error(`Setting '${name}' does not have a defaultValue`);
    }

    async getSetting(name) {
        isSetting(name)

        const setting = this.settings.get(name)
        const model = setting.model
        let data = await model.findOne({
            GuildID: this.guild.id
        })

        if (!data) {
            hasDefault(setting)

            data = new model({
                Value: setting.defaultValue,
                GuildID: this.guild.id
            })
            data.save()
        }

        return data.Value
    }

    async setSetting(name, value) {
        isSetting(name)

        const setting = this.settings.get(name)
        const model = setting.model
        let data = await model.findOne({
            GuildID: this.guild.id
        })

        if (data) {
            await model.findOneAndRemove({
                GuildID: this.guild.id
            })

            data = new model({
                Value: value,
                GuildID: this.guild.id
            })
            data.save()
        } else {
            hasDefault(setting)
            
            data = new model({
                Value: setting.defaultValue,
                GuildID: this.guild.id
            })
            data.save()
        }
    }
}

module.exports = Settings;