const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
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
        this.client.heroku.delete("/apps/serverstatbot/dynos/Worker").then(console.log).catch(console.error)
    }

    async execute() {
        if (process.env.ISDEV == "TRUE" || !process.env.HEROKUAPIKEY) return console.log("Restart can only be executed on heroku, use 'rs' command");
        this.restart()
    }
}

module.exports = Command