const Canvas = require("canvas")
const NodeCache = require("node-cache")
const Util = require("./Util")

const playerCache = new NodeCache({
    stdTTL: 3600,
})

class Mojang {
    constructor() {
        console.error(
            `The ${this.constructor.name} class cannot be constructed.`
        )
    }

    static specials = ["§", "&"]
    static colors = {
        0: "#000",
        1: "#0000aa",
        2: "#00aa00",
        3: "#00aaaa",
        4: "#aa0000",
        5: "#aa00aa",
        6: "#ffaa00",
        7: "#aaaaaa",
        8: "#555555",
        9: "#5555ff",
        a: "#55ff55",
        b: "#55ffff",
        c: "#ff5555",
        d: "#ff55ff",
        e: "#ffff55",
        f: "#fff",
        g: "#ddd605",
    }
    static effects = {
        k: (build) => {
            build.extras.obfuscated = true
        },
        l: (build) => {
            if (!build.font.includes("bold")) {
                build.font = "bold " + build.font
            }
        },
        m: (build) => {
            build.extras.strikethrough = true
        },
        n: (build) => {
            build.extras.underline = true
        },
        o: (build) => {
            if (!build.font.includes("italic")) {
                build.font = "italic " + build.font
            }
        },
        r: (build) => {
            build.extras = {
                obfuscated: false,
                underline: false,
                strikethrough: false,
            }
            build.fillStyle = this.colors.f
            build.font = "20px 'Minecraft'"
        },
    }

    static getFormatChars() {
        return this.specials
    }

    static getColorCodes() {
        return this.colors
    }

    static getEffects() {
        return this.effects
    }

    /**
     * Generate an motd image
     * @param {string} text
     * @param {number} spacing
     * @param {number} padding
     * @returns {Canvas.Canvas}
     */
    static generateMOTD(text, spacing, padding) {
        let lines = text.split("\n")
        const tempPadding = padding * 1.5

        let motd = Canvas.createCanvas(
            1024 + tempPadding * 2,
            20 * lines.length + spacing * (lines.length - 1) + tempPadding * 2
        )
        let context = motd.getContext("2d")
        context.imageSmoothingEnabled = false
        context.font = "20px 'Minecraft'"
        context.textBaseline = "top"
        context.textAlign = "left"
        context.fillStyle = "#fff"

        const specials = this.getFormatChars()
        const colors = this.getColorCodes()
        const effects = this.getEffects()

        lines.forEach((raw, index) => {
            let buildList = []
            let build = {
                text: "",
                fillStyle: colors.f,
                font: "20px 'Minecraft'",
                extras: {
                    obfuscated: false,
                    underline: false,
                    strikethrough: false,
                },
                changed: false,
            }

            let pushBuild = () => {
                if (build.extras.obfuscated) {
                    let length = build.text.length
                    build.text = ""
                    const banned = [
                        "/",
                        "?",
                        ":",
                        ";",
                        ".",
                        ",",
                        "'",
                        "|",
                        "\\",
                        "`",
                    ]
                    const start = 33,
                        end = 126
                    for (let i = 0; i < length; i++) {
                        let char
                        while (!char || banned.includes(char)) {
                            char = String.fromCharCode(
                                start +
                                    Math.floor(Math.random() * (end - start))
                            )
                        }
                        build.text += char
                    }
                }
                buildList.push(build)
            }

            for (let i = 0; i < raw.length; i++) {
                if (specials.includes(raw[i - 1])) continue
                let char = raw[i]
                if (specials.includes(char)) {
                    let code = raw[i + 1]
                    if (code) {
                        code = code.toLowerCase()
                        let color = colors[code]
                        if (color != null) {
                            if (build.fillStyle != colors.f || build.changed) {
                                pushBuild()
                                build = {
                                    text: "",
                                    fillStyle: color,
                                    font: build.font,
                                    extras: {
                                        obfuscated: build.extras.obfuscated,
                                        underline: build.extras.underline,
                                        strikethrough:
                                            build.extras.strikethrough,
                                    },
                                    changed: false,
                                }
                            } else build.fillStyle = color
                        } else {
                            let effect = effects[code]
                            if (effect) {
                                if (build.changed) {
                                    pushBuild()
                                    build = {
                                        text: "",
                                        fillStyle: build.fillStyle,
                                        font: build.font,
                                        extras: {
                                            obfuscated: build.extras.obfuscated,
                                            underline: build.extras.underline,
                                            strikethrough:
                                                build.extras.strikethrough,
                                        },
                                        changed: false,
                                    }
                                }

                                effect(build)
                            } else {
                                build.changed = true
                                build.text += char
                            }
                        }
                    } else {
                        build.changed = true
                        build.text += char
                    }
                } else {
                    build.changed = true
                    build.text += char
                }
            }
            if (buildList[buildList.length] != build) pushBuild(build)

            Util.fillMixedText(
                context,
                buildList,
                tempPadding,
                tempPadding + 20 * index + spacing * index,
                motd.width
            )
        })

        Util.autoCropCanvas(context, padding)
        context.globalCompositeOperation = "destination-over"
        context.fillStyle = "#000"
        context.fillRect(0, 0, motd.width, motd.height)

        return motd
    }

    /**
     * Generate a playerlist image
     * @param {{name: string, id?: string}[]} players
     * @param {Object<string, string>} lang
     * @param {number} columnLength
     * @param {number} maxColumns
     * @param {number} maxColumnWidth
     * @returns {Promise<Canvas.Canvas>}
     */
    static async generatePlayerList(
        players,
        lang,
        columnLength = 20,
        maxColumns = 4,
        maxColumnWidth = 256
    ) {
        const maxInList = columnLength * maxColumns - 1
        const amountInList = Math.min(maxInList, players.length)
        const height = Math.min(columnLength, amountInList)
        const columnCount = Math.ceil(amountInList / columnLength)

        let image = Canvas.createCanvas(
            (32 + maxColumnWidth) * columnCount + 5 * (columnCount - 1),
            height * 28
        )
        let context = image.getContext("2d")

        context.imageSmoothingEnabled = false
        context.font = "27px 'Minecraft'"
        context.textBaseline = "top"
        context.textAlign = "left"
        context.fillStyle = "#fff"

        await new Promise((resolve, reject) => {
            let done = 0
            players.forEach((player, i) => {
                const column = Math.floor(i / columnLength)

                if (i >= maxInList) {
                    if (i == maxInList) {
                        context.fillText(
                            lang.AND_MORE.format(players.length - maxInList),
                            2 + maxColumnWidth * column + 5 * column,
                            (i - columnLength * column) * 28 - 2,
                            maxColumnWidth - 2
                        )
                    }
                    if (done >= amountInList) resolve()
                } else {
                    Canvas.loadImage(
                        `https://mc-heads.net/avatar/${player.name.clean}/22`
                    )
                        .then((head) => {
                            context.drawImage(
                                head,
                                2 + maxColumnWidth * column + 5 * column,
                                2 + (i - columnLength * column) * 28,
                                22,
                                22
                            )
                        })
                        .catch((e) => {
                            Util.error(e, "Mojang", "loadImage")
                        })
                        .finally(() => {
                            context.fillText(
                                player.name.clean,
                                32 + maxColumnWidth * column + 5 * column,
                                (i - columnLength * column) * 28 - 2,
                                maxColumnWidth - 32
                            )
                            done++
                            if (done >= amountInList) resolve()
                        })
                }
            })
        })

        return image
    }

    /**
     * Get the status of one or all mojang services
     * @param {string} checkDomain
     * @returns {Promise<Object | string>}
     */
    static async getStatus(checkDomain = null) {
        let result = await Util.requestAsync("https://status.mojang.com/check")
        result = JSON.parse(result)

        let statuses = {}
        result.forEach((domain) => {
            statuses[Object.keys(domain)[0]] = Object.values(domain)[0]
        })

        if (!checkDomain) return statuses
        return statuses[checkDomain] ?? "grey"
    }

    /**
     * Check if string is a valid uuid
     * @param {string} uuid
     * @param {boolean} hyphens
     * @returns {boolean}
     */
    static isUUID(uuid, hyphens) {
        if (!uuid) return false
        if (hyphens)
            return /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(
                uuid
            )
        return /^[0-9A-F]{8}[0-9A-F]{4}[4][0-9A-F]{3}[89AB][0-9A-F]{3}[0-9A-F]{12}$/i.test(
            uuid
        )
    }

    /**
     * Get UUID of a user
     * @param {string} username
     */
    static async getUUID(username) {
        let cacheKey = username.toLowerCase()
        if (playerCache.has(cacheKey)) return playerCache.get(cacheKey)
        let result = await Util.requestAsync(
            `https://api.mojang.com/users/profiles/minecraft/${username}`
        )
        if (!result) return null

        result = JSON.parse(result)
        playerCache.set(cacheKey, result.id)
        return result.id
    }

    static async getNameHistory(uuid) {
        let cacheKey = uuid.replace(/-/g, "").toLowerCase()
        if (playerCache.has(cacheKey)) return playerCache.get(cacheKey)
        let result = await Util.requestAsync(
            `https://api.mojang.com/user/profiles/${uuid}/names`
        )
        result = JSON.parse(result)
        if (!result) return null

        let history = {
            current: result[result.length - 1].name,
            original: result[0].name,
            changes: result.reverse(),
        }
        playerCache.set(cacheKey, history)
        return history
    }

    static async getUserDatas(...usernames) {
        let result = await Util.requestAsync({
            hostname: "api.mojang.com",
            path: "/profiles/minecraft",
            protocol: "HTTPS",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(usernames),
        })

        return JSON.parse(result)
    }
}

module.exports = Mojang
