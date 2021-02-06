const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "logout",
            desc: "Takes the bot offline",
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(message) {
        Util.replyMessage(message, "Goodbye :wave:")

        this.client.destroy()
    }
}

module.exports = Command