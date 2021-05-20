const CSV = require("csv")
const FileSystem = require("fs")

const langs = {}

let headers, keyIndex
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
                langs[headers[i]] = {}
            }

            continue
        };

        if (keyIndex == null || !record[keyIndex]) continue;

        
        for (i = keyIndex + 1; i < headers.length; i++) {
            langs[headers[i]][record[keyIndex]] = record[i] ? record[i].replace(/\\n/g, "\n") : ""
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
        const defaultLang = langs["en-us"];
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