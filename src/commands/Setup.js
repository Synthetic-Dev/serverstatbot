const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setup",
            descId: "COMMAND_SETUP",
            args: [
                {
                    name: "page",
                    descId: "COMMAND_SETUP_ARG1",
                    optional: true
                }
            ],
            perms: [
                "ADMINISTRATOR"
            ]
        })
    }

    async execute(options) {
        let startPage = options.inputs[0] ? Number(options.inputs[0]) : 1
        if (typeof(startPage) != "number" || startPage == null || isNaN(startPage)) return Util.replyError(options.message, options.lang.MUST_NUMBER.format("page"));
        
        let pages = [
            {
                title: options.lang.COMMAND_SETUP_PAGE1_TITLE,
                description: options.lang.COMMAND_SETUP_PAGE1_DESC.format(options.prefix)
            },
            {
                title: options.lang.COMMAND_SETUP_PAGE2_TITLE,
                description: options.lang.COMMAND_SETUP_PAGE2_DESC.format(options.prefix)
            },
            {
                title: options.lang.COMMAND_SETUP_PAGE3_TITLE,
                description: options.lang.COMMAND_SETUP_PAGE3_DESC.format(options.prefix)
            },
            {
                title: options.lang.COMMAND_SETUP_PAGE4_TITLE,
                description: options.lang.COMMAND_SETUP_PAGE4_DESC.format(options.prefix)
            },
            {
                title: options.lang.COMMAND_SETUP_PAGE5_TITLE,
                description: options.lang.COMMAND_SETUP_PAGE5_DESC.format(options.prefix)
            },
        ]

        pages.forEach(page => {
            page.embed = {
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                title: page.title,
                description: page.description,
                color: 16760391,
                timestamp: Date.now(),
                footer: Util.getFooter(options.message, false)
            }
            delete page.title
            delete page.description
        })

        Util.sendPages(options.message, pages, Math.clamp(startPage, 1, pages.length) - 1, 240, -1)
    }
}

module.exports = Command