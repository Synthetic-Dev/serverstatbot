const Discord = require("discord.js");
const Canvas = require("canvas")
const Mongoose = require("mongoose")

const Settings = require("./settings.js")
const Util = require("./util.js")

/**
 * Startup
 */
require("dotenv").config()
Canvas.registerFont("./assets/botfont.ttf", {family: "Pixel Font"})
const client = new Discord.Client();

Mongoose.connect(`mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@${process.env.DBCLUSTER}.${process.env.DBDOMAIN}.mongodb.net/data`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

/**
 * Startup
 */
client.on("ready", async () => {
    client.settings = []
    client.players = []

    client.guilds.cache.forEach(guild => {
        client.settings[guild.id] = new Settings(guild);
    })

    client.commands = Util.loadmodules("commands", (command, commands) => {
        command = new command(client)
        commands.set(command.name(true), command)

        let aliases = command.aliases ? command.aliases() : null
        if (aliases) {
            for (let alias of aliases) {
                commands.set(alias.toLowerCase(), command)
            }
        }
    })

    client.user.setActivity("the stats", {
        type: "WATCHING"
    })

    console.log("Bot started successfully")

    while (true) {
        client.guilds.cache.forEach(async guild => {
            let settings = client.settings[guild.id]

            let channelId = await settings.getSetting("logchannel")
            let channel = Util.getChannelById(guild, channelId)
            if (!channel) return;

            let address = `${await settings.getSetting("ip")}:${await settings.getSetting("port")}`

            Util.request(`https://api.mcsrvstat.us/2/${address}.tld`, (success, data) => {
                if (success) {
                    data = JSON.parse(data)
                    
                    let old = client.players[address]
                    let current = data.players.list

                    current.foreach((player) => {
                        if (!old.includes(player)) {
                            channel.send({
                                content: "Has joined the game.",
                                embed: {
                                    author: {
                                        name: `${player}`,
                                        icon_url: `https://minotar.net/helm/${player}/22.png`
                                    }
                                }
                            })
                        }
                    })

                    old.foreach((player) => {
                        if (!current.includes(player)) {
                            channel.send({
                                content: "Has left the game.",
                                embed: {
                                    author: {
                                        name: `${player}`,
                                        icon_url: `https://minotar.net/helm/${player}/22.png`
                                    }
                                }
                            })
                        }
                    })
                }
            })
        })

        await Util.sleep(60*1000)
    }
});

client.on("guildCreate", guild => {
    if (!client.settings) client.settings = [];

    client.settings[guild.id] = new Settings(guild);
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

        if (!Util.doesMemberHavePermission(message.member, permissions)) {
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