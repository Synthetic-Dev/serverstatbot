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
     * Get a setting's value
     * @param {string} name 
     */
    async getSetting(name) {
        this.isSetting(name)

        const setting = this.settings.get(name)
        if (!setting) return null;
        let data = await setting.findOne({
            GuildID: this.guild.id
        })

        if (!data) {
            data = new setting({
                GuildID: this.guild.id
            })
            data.save()
        }

        return data.Value
    }

    /**
     * Set a setting's value
     * @param {string} name 
     * @param {*} value 
     */
    async setSetting(name, value) {
        this.isSetting(name)

        const setting = this.settings.get(name)
        let data = await setting.findOne({
            GuildID: this.guild.id
        })

        if (data) {
            await setting.findOneAndDelete({
                GuildID: this.guild.id
            })
        }

        data = new setting({
            Value: value,
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
        let data = await setting.findOne({
            GuildID: this.guild.id
        })

        if (!data) {
            data = new setting({
                GuildID: this.guild.id
            })
        }

        let newValue = await transform(data.Value)
        if (!newValue || data.Value == newValue) return;

        await setting.findOneAndDelete({
            GuildID: this.guild.id
        })

        data = new setting({
            Value: newValue,
            GuildID: this.guild.id
        })
        data.save()
    }
}

module.exports = Settings;