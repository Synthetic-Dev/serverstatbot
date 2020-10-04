const discord = require("discord.js")

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

    async execute(inputs, message) {
        await message.reply("Goodbye :wave:")
        await this.client.user.setStatus("invisible")

        this.client.destroy()
    }
}

module.exports = Command