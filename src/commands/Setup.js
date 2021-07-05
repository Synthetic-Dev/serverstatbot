const Discord = require("discord.js")

const Util = require("../utils/Util")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setup",
            descId: "COMMAND_SETUP",
            aliases: ["guide"],
            args: [
                {
                    name: "page",
                    descId: "COMMAND_SETUP_ARG1",
                    optional: true,
                },
            ],
            perms: ["ADMINISTRATOR"],
        })
    }

    sendSetup(options, startPage = 0) {
        const pages = [
            {
                title: options.lang.COMMAND_SETUP_PAGE1_TITLE,
                description: options.lang.COMMAND_SETUP_PAGE1_DESC.format(
                    options.prefix
                ),
            },
            {
                title: options.lang.COMMAND_SETUP_PAGE2_TITLE,
                description: options.lang.COMMAND_SETUP_PAGE2_DESC.format(
                    options.prefix
                ),
            },
            {
                title: options.lang.COMMAND_SETUP_PAGE3_TITLE,
                description: options.lang.COMMAND_SETUP_PAGE3_DESC.format(
                    options.prefix
                ),
            },
            {
                title: options.lang.COMMAND_SETUP_PAGE4_TITLE,
                description: options.lang.COMMAND_SETUP_PAGE4_DESC.format(
                    options.prefix
                ),
            },
            {
                title: options.lang.COMMAND_SETUP_PAGE5_TITLE,
                description: options.lang.COMMAND_SETUP_PAGE5_DESC.format(
                    options.prefix
                ),
            },
        ]

        pages.forEach((page) => {
            const embed = new Discord.MessageEmbed()
                .setTitle(page.title)
                .setDescription(page.description)
                .setColor(16760391)
                .setAuthor(
                    this.client.user.username,
                    this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png",
                    })
                )
                .setTimestamp()

            page.embed = embed
            delete page.title
            delete page.description
        })

        Util.sendPages(options, pages, startPage, 240, -1)
    }

    async execute(options) {
        let startPage = options.inputs[0] ? Number(options.inputs[0]) : 1
        if (
            typeof startPage != "number" ||
            startPage == null ||
            isNaN(startPage)
        )
            return Util.replyError(
                options.message,
                options.lang.MUST_NUMBER.format("page")
            )

        this.sendSetup(options, Math.clamp(startPage, 1, 5) - 1)
    }
}

module.exports = Command
