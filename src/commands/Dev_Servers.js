const Util = require("../utils/util.js")
const ICommand = require("../interfaces/ICommand.js")

class Command extends ICommand {
    constructor(client) {
        super(client, {
            name: "devservers",
            desc: "View all connected servers and details",
            aliases: [
                "dservers",
                "dsrvs"
            ],
            perms: [
                "DEV"
            ],
            private: true
        })
    }

    async execute(message) {
        const getserver = this.client.commands.get("devgetserver")
        let pages = []

        let promise = Util.sendMessage(message.channel, ":arrows_counterclockwise: Getting servers...")
        if (!promise) return;
        let botMessage = await promise

        let cache = this.client.guilds.cache

        cache.forEach(async guild => {
            pages.push(await getserver.getServer(guild))

            if (pages.length == cache.size) {
                try {
                    botMessage.delete()
                } catch(e) {console.error(e)}

                Util.sendPages(message, pages)
            }
        })
    }
}

module.exports = Command