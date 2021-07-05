const CSV = require("csv")
const FileSystem = require("fs")

//const Types = require("../../typings")

const langs = {}
const defaultKey = "en-us"

{
    let headers, keyIndex, defaultIndex
    let parser = CSV.parse({
        delimiter: ",",
    })
        .on("readable", function () {
            while ((record = parser.read())) {
                if (headers == null) {
                    headers = record
                    keyIndex = headers.indexOf("key")

                    for (i = keyIndex + 1; i < headers.length; i++) {
                        let locale = headers[i].toLowerCase()
                        if (locale == defaultKey) defaultIndex = i
                        langs[locale] = {}
                    }

                    continue
                }

                if (keyIndex == null || !record[keyIndex]) continue

                for (i = keyIndex + 1; i < headers.length; i++) {
                    langs[headers[i]][record[keyIndex]] = record[i]
                        ? record[i].replace(/\\n/g, "\n")
                        : record[defaultIndex]
                        ? record[defaultIndex].replace(/\\n/g, "\n")
                        : "ERROR"
                }
            }
        })
        .on("error", function (err) {
            console.error("[Locales] " + err.message)
        })
        .on("finish", function () {
            console.log("[Locales] Loading complete")
        })
    FileSystem.createReadStream(`${__dirname}/../../assets/lang/lang.csv`).pipe(
        parser
    )
}

/**
 * Allows retrieval of language JSOs depending on locale
 * @class
 */
class LocaleManager {
    constructor() {
        console.error(
            `The ${this.constructor.name} class cannot be constructed.`
        )
    }

    /**
     * Gets the lang file associated with the given locale
     * @param {string} locale
     * @returns {Types.Translations}
     */
    static getLang(locale) {
        const defaultLang = langs[defaultKey]
        return defaultLang

        if (!locale) return defaultLang
        locale = locale.toLowerCase()
        if (langs[locale]) return langs[locale]
        return defaultLang
    }

    /**
     * Gets an a dictionary of all language JSOs
     * @returns {Types.TranslationsDictionary}
     */
    static getLangs() {
        return langs
    }
}

module.exports = LocaleManager
