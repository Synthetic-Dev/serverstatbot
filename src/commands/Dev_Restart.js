const CommandBase = require("../interfaces/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "restart",
            desc: "Restarts the bot",
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    restart() {
        const heroku = this.client.heroku
        this.client.destroy()
        
        heroku.delete("/apps/serverstatbot/dynos/Worker").then(data => {console.log(`Internal restart, ${data.toString()}`)}).catch(console.error)
    }

    async execute() {
        if (process.env.ISDEV == "TRUE" || !process.env.HEROKUAPIKEY) return console.log("Restart can only be executed on heroku, use 'rs' command");
        this.restart()
    }
}

module.exports = Command