const Discord = require("discord.js")

const Util = require("../utils/Util")
const LocaleManager = require("../classes/LocaleManager")
const CommandBase = require("../classes/CommandBase")

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "language",
            descId: "COMMAND_LANGUAGE",
            aliases: ["languages", "lang", "translations", "translators"],
        })
    }

    async execute(options) {
        const langs = LocaleManager.getLangs()
        let languages = []
        let got = []
        Object.keys(langs).forEach((key) => {
            let lang = langs[key]
            if (
                lang.language &&
                lang.language_native &&
                got.indexOf(lang.language) < 0
            ) {
                languages.push(`• ${lang.language} (${lang.language_native})`)
                got.push(lang.language)
            }
        })

        const embed = new Discord.MessageEmbed()
            .setTitle(options.lang.COMMAND_LANGUAGE_TITLE)
            .setDescription(options.lang.COMMAND_LANGUAGE_DESC_UD)
            .setColor(5145560)
            .setAuthor(
                this.client.user.username,
                this.client.user.avatarURL({
                    size: 64,
                    dynamic: true,
                    format: "png",
                })
            )
            .addFields(
                {
                    name: options.lang.COMMAND_LANGUAGE_FIELD1,
                    value: languages.join("\n"),
                },
                {
                    name: options.lang.COMMAND_LANGUAGE_FIELD2,
                    value:
                        "• " +
                        [
                            "SyntheticDev",
                            "Leclowndu93150 (French)",
                            "Арсений (Russian)",
                            "MickyDerJuni (German)",
                        ].join("\n• "),
                }
            )
            .setFooter(Util.getFooter(options.message).text)
            .setTimestamp()

        Util.sendMessage(options.message, embed).catch((e) => {
            Util.error(e, "Language", "sendMessage")
        })
    }
}

module.exports = Command
