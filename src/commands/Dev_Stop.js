const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "stop",
            descId: "COMMAND_DEV_STOP",
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