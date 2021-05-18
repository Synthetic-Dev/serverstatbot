const Util = require("../utils/util.js")
const LocaleManager = require("../utils/localeManager.js")
const CommandBase = require("../classes/CommandBase.js")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "language",
            descId: "COMMAND_LANGUAGE",
            aliases: [
                "languages",
                "lang",
                "translations",
                "translators"
            ]
        })
    }

    async execute(options) {
        const langs = LocaleManager.getLangs()
        let languages = []
        Object.keys(langs).forEach(key => {
            let lang = langs[key]
            if (lang.language && lang.language_native) {
                languages.push(`• ${lang.language} (${lang.language_native})`)
            }
        })

        Util.sendMessage(options.message, {
            embed: {
                title: options.lang.COMMAND_LANGUAGE_TITLE,
                description: options.lang.COMMAND_LANGUAGE_DESC_UD,
                color: 5145560,
                author: {
                    name: this.client.user.username,
                    icon_url: this.client.user.avatarURL({
                        size: 64,
                        dynamic: true,
                        format: "png"
                    })
                },
                fields: [
                    {
                        name: options.lang.COMMAND_LANGUAGE_FIELD1,
                        value: languages.join("\n")
                    },
                    {
                        name: options.lang.COMMAND_LANGUAGE_FIELD2,
                        value: ["• SyntheticDev#9931", "• Leclowndu93150#1371 (French)", "• Арсений#8132 (Russian)"].join("\n")
                    }
                ],
                timestamp: Date.now(),
                footer: Util.getFooter(options.message)
            }
        }).catch(e => {
            console.error(`Language[sendMessage]: ${e.toString()};\n${e.method} at ${e.path}`)
        })
    }
}

module.exports = Command