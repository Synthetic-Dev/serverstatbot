const fs = require("fs")

const defaults = require("./defaults.json")

class Settings {
    constructor(guild) {
        this.guild = guild

        const dir = `${__dirname.replace("\src", "")}/configs/${guild.id}config.json`
        this.dirname = dir

        this.settings = defaults // temp

        /*
        if (fs.existsSync(dir)) {
            this.settings = require(dir)

            let flag = false

            Object.entries(defaults).forEach(([key, value]) => {
                if (!this.settings[key]) {
                    this.settings[key] = value
                    flag = true
                }
            });

            //if (flag) fs.writeFileSync(this.dirname, JSON.stringify(this.settings), "utf8");
        } else {
            fs.writeFileSync(dir, JSON.stringify(defaults), "utf8")
            this.settings = require(dir)
        }
        */
    }

    async save() {
        //fs.writeFileSync(this.dirname, JSON.stringify(this.settings), "utf8")
    }

    getSetting(name) {
        if (this.settings[name] == null) console.error(`${name} is not a setting`);

        return this.settings[name];
    }

    async setSetting(name, value) {
        if (!this.settings[name]) console.error(`${name} is not a setting`);

        this.settings[name] = value;

        this.save()
    }
}

module.exports = Settings;