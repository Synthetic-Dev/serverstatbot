const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "restart",
            descId: "COMMAND_DEV_RESTART",
            perms: ["DEV"],
            private: true,
        })
    }

    restart() {
        const heroku = this.client.heroku
        this.client.destroy()

        heroku
            .delete("/apps/serverstatbot/dynos/Worker")
            .then((data) => {
                console.log(`Internal restart, ${data.toString()}`)
            })
            .catch((e) => {
                Util.error(e, "Dev_Restart", "deleteWorker")
            })
    }

    async execute() {
        if (process.env.ISDEV == "TRUE" || !process.env.HEROKUAPIKEY)
            return console.log(
                "Restart can only be executed on heroku, use 'rs' command"
            )
        this.restart()
    }
}

module.exports = Command
