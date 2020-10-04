const discord = require("discord.js");
const canvas = require("canvas")
const mongoose = require("mongoose")

const settings = require("./settings.js")
const util = require("./util.js")

/**
 * Startup
 */
canvas.registerFont("./assets/botfont.ttf", {family: "Pixel Font"})
const client = new discord.Client();

mongoose.connect(`mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@serverstatcluster.oi5gf.mongodb.net/data`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

/**
 * Startup
 */
client.on("ready", () => {
    client.settings = []

    client.guilds.cache.forEach(guild => {
        client.settings[guild.id] = new settings(guild);
    })

    client.commands = util.loadmodules("commands", client)

    client.user.setActivity("the stats", {
        type: "WATCHING"
    })

    console.log("Bot started successfully")
});

client.on("guildCreate", guild => {
    if (!client.settings) client.settings = [];

    client.settings[guild.id] = new settings(guild);
})

client.on("guildDelete", guild => {
    if (client.settings) {
        client.settings[guild.id] = null;
    }
})


/**
 * Command Parser
 */
client.on("message", async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return message.reply("You can only use commands in a guild");

    const settings = client.settings[message.guild.id]
    const prefix = await settings.getSetting("prefix")

    const content = message.content

    if (content.startsWith(prefix)) {
        let [commandName, ...inputs] = content
        .trim()
        .substring(prefix.length)
        .split(/\s+/);

        if (!commandName || commandName.length == 0) return;
    
        if (!client.commands) return console.error("Commands not loaded");

        const command = client.commands.get(commandName.toLowerCase())

        if (!command) return message.reply(`'${commandName}' is not a command`);

        const permissions = command.permissions()

        if (!util.doesUserHavePermission(message.member, permissions)) {
            return message.reply("You don't have permission to do that");
        }

        const arguments = command.numOfArguments()
        if (inputs.length < arguments) return message.reply(`'${commandName.toLowerCase()}' expects ${arguments} argument(s), got ${inputs.length}`);

        let end = inputs.slice(arguments - 1).join(" ")
        inputs = inputs.slice(0, arguments - 1)
        inputs[arguments - 1] = end

        command.execute(inputs, message)
    }
});

/**
 * Login
 */
client.login(process.env.TOKEN);