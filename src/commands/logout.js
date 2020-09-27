const discord = require("discord.js")
const util = require("../util.js")

const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "logout",
            desc: "Takes the bot offline",
            perms: [
                255733848162304002
            ],
            private: true
        })
    }

    async execute(inputs, message) {
        await message.reply("Goodbye :wave:")
        await this.client.user.setStatus("invisible")

        this.client.destroy()
    }
}

module.exports = Command