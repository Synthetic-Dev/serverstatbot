const CSV = require("csv")
const FileSystem = require("fs")

const langs = {}

const defaultKey = "en-us"
let headers, keyIndex, defaultIndex
let parser = CSV.parse({
    delimiter: ',',
    //quote: "\"",
    //encoding: 'utf',
})
.on("readable", function() {
    while (record = parser.read()) {
        if (headers == null) {
            headers = record
            keyIndex = headers.indexOf("key")

            for (i = keyIndex + 1; i < headers.length; i++) {
                let locale = headers[i].toLowerCase()
                if (locale == defaultKey) defaultIndex = i;
                langs[locale] = {}
            }

            continue
        };

        if (keyIndex == null || !record[keyIndex]) continue;

        
        for (i = keyIndex + 1; i < headers.length; i++) {
            langs[headers[i]][record[keyIndex]] = record[i] ? record[i].replace(/\\n/g, "\n") : (record[defaultIndex] ? record[defaultIndex].replace(/\\n/g, "\n") : "ERROR")
        }
    }
})
.on("error", function(err) {
    console.error("[Locales] " + err.message);
})
.on("finish", function() {
    console.log("[Locales] Loading complete")
})
FileSystem.createReadStream(`${__dirname}/../../lang.csv`).pipe(parser)

class LocaleManager {
    constructor() {
        console.error(`The ${this.constructor.name} class cannot be constructed.`);
    }

    /**
     * Gets the lang file associated with the given locale
     * @param {string} locale 
     * @returns {Object<string, string>}
     */
     static getLang(locale) {
        const defaultLang = langs[defaultKey];
        return defaultLang

        if (!locale) return defaultLang;
        locale = locale.toLowerCase()
        if (langs[locale]) return langs[locale];
        return defaultLang
    }

    static getLangs() {
        return langs
    }
}

module.exports = LocaleManager