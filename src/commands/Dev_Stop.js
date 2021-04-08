const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "stop",
            desc: "Takes the bot offline",
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute() {
        this.client.destroy()
        process.exit(0)
    }
}

module.exports = Command