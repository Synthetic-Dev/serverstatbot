const Discord = require("discord.js")
const Canvas = require("canvas")
const HTTPS = require("https")
const HTTP = require("http")
const FileSystem = require("fs")

const LocaleManager = require("./managers/localeManager.js")

const unicodeEmojis = require("../unicodeEmojis.json")
const LocalSettings = require("../localSettings.json")

if (!String.prototype.format) {
    String.prototype.format = function() {
        let args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

if (!String.prototype.toTitleCase) {
    String.prototype.toTitleCase = function(allWords = false) {
        let string = this.toLowerCase().split(" ")
        if (!allWords) return this.toTitleCase(string.shift(), true) + " " + string.join(" ")
        string.forEach((word, index) => {
            string[index] = word.substr(0, 1).toUpperCase() + word.substr(1)
        })
        return string.join(" ")
    }
}

if (!Math.clamp) {
    Math.clamp = function(value, min, max) {
        return Math.max(min, Math.min(max, value))
    }
}

class Util {
    constructor() {
        console.error(`The ${this.constructor.name} class cannot be constructed.`);
    }

    /**
     * Returns a promise that timesout after milliseconds
     * @param {number} milliseconds 
     * @return {Promise}
     */
    static sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    /**
     * Sends a request to the given request options
     * @param {string | HTTP.RequestOptions | HTTPS.RequestOptions} options The request options
     * @param {Function} callback A function that is called when a response is received
     */
    static request(options, callback) {
        const isUrl = typeof options == "string"
        const method = isUrl ? (options.toLowerCase().slice(0, 5) == "https" ? HTTPS : HTTP) : (options.protocol == "HTTP" ? HTTP : HTTPS)
        delete options.protocol

        let handler = response => {
            let data = ""

            response.on("data", chunk => {
                data += chunk
            })

            response.on("end", () => {
                callback(true, data)
            })
        }

        let req
        if (isUrl) {
            req = method.get(options, handler)
        } else {
            req = method.request(options, handler)
        }

        req.on("error", error => {
            callback(false, error)
        })

        if (!isUrl) {
            if (options.data) req.write(options.data);
            req.end()
        };
    }

    /**
     * Sends a request to the given request options
     * @param {string | HTTP.RequestOptions | HTTPS.RequestOptions} options The request options
     * @returns {Promise<string>} A promise that resolves with the response
     */
    static requestAsync(options) {
        return new Promise((resolve, reject) => {
            const isUrl = typeof options == "string"
            const method = isUrl ? (options.toLowerCase().slice(0, 5) == "https" ? HTTPS : HTTP) : (options.protocol == "HTTP" ? HTTP : HTTPS)
            delete options.protocol

            let handler = response => {
                let data = ""
    
                response.on("data", chunk => {
                    data += chunk
                })
    
                response.on("end", () => {
                    resolve(data)
                })
            }

            let req
            if (isUrl) {
                req = method.get(options, handler)
            } else {
                req = method.request(options, handler)
            }

            req.on("error", error => {
                reject(error)
            })

            if (!isUrl) {
                if (options.data) req.write(options.data);
                req.end()
            };
        })
    }

    /**
     * Loads .js files from the given directory
     * @param {string} dir Directory to the folder that holds all the modules to be loaded
     * @param {Function} register A function that is called that registers the modules into the Collection
     * @returns {Discord.Collection} A collection that contains all of the loaded modules
     */
    static loadmodules(dir, register) {
        const modules = new Discord.Collection()

        FileSystem.readdir(`${__dirname}/../${dir}`, (error, files) => {
            if (error) console.error(error);
            if (!files) return console.log(`There are no files at /${dir}`);

            const jsfiles = files.filter(file => file.split(".").pop() == "js")

            if (jsfiles.length === 0) return console.log(`No .js files to load at /${dir}`);

            jsfiles.forEach(file => {
                let Module = require(`../${dir}/${file}`)

                if (register) {
                    register(Module, modules)
                } else {
                    let module = new Module()
                    modules.set(module.name(), module)
                }
            })
        })

        return modules
    }

    /**
     * Decorate text with underlines and strikethroughs
     * @param {Canvas.CanvasRenderingContext2D} context 
     * @param {string} text 
     * @param {string} style
     * @param {number} x 
     * @param {number} y 
     * @param {number} thickness
     */
    static decorateText(context, text, style, x, y, thickness) {
        context.save()
        style = style.toLowerCase()

        let metrics = context.measureText(text)
        let width = metrics.width
        let height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        switch(context.textAlign){
            case "center":
                x -= (width / 2); break;
            case "right":
                x -= width; break;
        }
        thickness = thickness ?? height / 8
        thickness = context.font.toLowerCase().includes("bold") ? thickness * 1.5 : thickness
        
        if (style.includes("underline")) {
            context.fillRect(x, y + metrics.actualBoundingBoxDescent, width, thickness)
        }

        if (style.includes("strikethrough")) {
            context.fillRect(x, y + metrics.actualBoundingBoxDescent - height / 2, width, thickness * 1.2)
        }

        context.restore();
    }

    /**
     * Write multi-colored text onto a canvas
     * @param {Canvas.CanvasRenderingContext2D} context 
     * @param {(string[])[]} splitText 
     * @param {number} x 
     * @param {number} y 
     */
    static fillMixedText(context, splitText, x, y, maxWidth) {
        let defaultFillStyle = context.fillStyle
        let defaultFont = context.font
        context.save()

        splitText.forEach(({text, fillStyle, font, extras}) => {
            context.fillStyle = fillStyle || defaultFillStyle;
            context.font = font || defaultFont;
            context.fillText(text, x, y, maxWidth);
            if (extras && (extras.underline || extras.strikethrough)) {
                let style = ""
                if (extras.underline) style += "underline ";
                if (extras.strikethrough) style += "strikethrough ";
                this.decorateText(context, text, style.trim(), x, y);
            }
            x += context.measureText(text).width;
        });
        context.restore();
    }

    /**
     * Auto crops a canvas to only contain its contents
     * @param {Canvas.CanvasRenderingContext2D} context 
     * @param {number} padding
     */
    static autoCropCanvas(context, padding = 0) {
        let canvas = context.canvas, 
        w = canvas.width, h = canvas.height,
        pixels = {
            x: [],
            y: []
        },
        imageData = context.getImageData(0, 0, canvas.width, canvas.height),
        x, y, index;
      
        for (y = 0; y < h; y++) {
          for (x = 0; x < w; x++) {
            index = (y * w + x) * 4;
            if (imageData.data[index + 3] > 0) {
              pixels.x.push(x);
              pixels.y.push(y);
            } 
          }
        }

        pixels.x.sort((a, b) => {return a - b});
        pixels.y.sort((a, b) => {return a - b});
        let n = pixels.x.length - 1;
      
        w = Math.min(w, 1 + pixels.x[n] - pixels.x[0] + padding*2);
        h = Math.min(h, 1 + pixels.y[n] - pixels.y[0] + padding*2);
        let cropped = context.getImageData(Math.max(0, pixels.x[0] - padding), Math.max(0, pixels.y[0] - padding), w, h);
      
        canvas.width = w;
        canvas.height = h;
        context.putImageData(cropped, 0, 0);
    }

    /**
     * Create a graph
     * @param {{x: number, y: number}[]} graphData 
     * @param {{start?: number, max?: number, increment?: number, name: string, formatter: (value: number) => string | number}} xAxis 
     * @param {{start?: number, max?: number, increment?: number, name: string, formatter: (value: number) => string | number}} yAxis 
     * @returns {Canvas.Canvas}
     */
    static createGraph(graphData, xAxis, yAxis) {
        xAxis.increment = xAxis.increment ?? 1
        yAxis.increment = yAxis.increment ?? 1
        xAxis.clamp = xAxis.clamp ?? false
        yAxis.clamp = yAxis.clamp ?? true

        let smallestX = xAxis.start
        let smallestY = yAxis.start
        let largestX = xAxis.max ?? 0
        let largestY = yAxis.max ?? 0
        graphData.forEach(({x, y}, index) => {
            let remove = false
            if ((xAxis.start && x < xAxis.start) || (yAxis.start && y < yAxis.start)) remove = true;

            if (!remove) {
                if (!xAxis.max) largestX = x > largestX ? x : largestX
                else if (x > xAxis.max) {
                    remove = true
                }
            }
            if (!remove) {
                if (!yAxis.max) largestY = y > largestY ? y : largestY
                else if (y > yAxis.max) {
                    remove = true
                }
            }
            if (!remove && !xAxis.start) smallestX = smallestX == null || x < smallestX ? x : smallestX
            if (!remove && !yAxis.start) smallestY = smallestY == null || y < smallestY ? y : smallestY

            if (remove) graphData.slice(index, 1);
        })

        if (xAxis.clamp) {
            xAxis.start = Math.floor(smallestX / xAxis.increment) * xAxis.increment
            xAxis.max = Math.ceil(largestX / xAxis.increment) * xAxis.increment
        } else {
            xAxis.start = smallestX
            xAxis.max = largestX
        }

        if (yAxis.clamp) {
            yAxis.start = Math.floor(smallestY / yAxis.increment) * yAxis.increment
            yAxis.max = Math.ceil(largestY / yAxis.increment) * yAxis.increment
        } else {
            yAxis.start = smallestY
            yAxis.max = largestY
        }

        const font = "Arial"

        const graphWidth = 800
        const graphHeight = 500
        const labelPadding = 60
        const midPadding = 10
        const numberPadding = 30
        const totalPadding = labelPadding + numberPadding + midPadding

        let graph = Canvas.createCanvas(graphWidth, graphHeight)
        let context = graph.getContext("2d")

        context.quality = "best"
        context.fillStyle = "#fff"
        context.imageSmoothingEnabled = false

        context.strokeStyle = "#fff"
        context.lineWidth = 3

        context.beginPath()
        context.moveTo(totalPadding, totalPadding - numberPadding / 2)
        context.lineTo(totalPadding, graphHeight - totalPadding)
        context.lineTo(graphWidth - totalPadding + numberPadding / 2, graphHeight - totalPadding)
        context.stroke()
        context.closePath()

        context.textAlign = "center"
        let fontSize = labelPadding / 2 - 2
        context.font = `bold ${fontSize}px '${font}'`
        context.fillText(xAxis.name, graphWidth / 2, graphHeight - labelPadding / 2 + fontSize / 2, graphWidth - labelPadding * 2)

        context.save()
        context.translate(graphWidth, 0)
        context.rotate(-Math.PI/2)
        context.fillText(yAxis.name, -graphHeight / 2, labelPadding / 2 - graphWidth, graphHeight - labelPadding * 2)
        context.restore()

        context.translate(totalPadding, graphHeight - totalPadding)

        fontSize = numberPadding * 0.8
        context.font = `${fontSize}px '${font}'`

        const maxIndexX = Math.round((xAxis.max - xAxis.start) / xAxis.increment)
        const maxIndexY = Math.round((yAxis.max - yAxis.start) / yAxis.increment)

        context.save()
        context.lineWidth = 2
        context.globalAlpha = 0.1
        context.beginPath()
        for (let x = xAxis.start; x < xAxis.max + xAxis.increment / 2.1; x += xAxis.increment) {
            let index = Math.round((x - xAxis.start) / xAxis.increment) - 0.5
            if (index <= 0) continue;

            let percentage = index / maxIndexX
            let x1 = (graphWidth - totalPadding * 2) * percentage
            context.moveTo(x1, 0)
            context.lineTo(x1, -(graphHeight - totalPadding * 2 + numberPadding / 2))
        }

        for (let y = yAxis.start; y < yAxis.max + yAxis.increment / 2.1; y += yAxis.increment) {
            let index = Math.round((y - yAxis.start) / yAxis.increment) - 0.5
            if (index <= 0) continue;

            let percentage = index / maxIndexY
            let y1 = -(graphHeight - totalPadding * 2) * percentage
            context.moveTo(0, y1)
            context.lineTo(graphWidth - totalPadding * 2 + numberPadding / 2, y1)
        }
        context.stroke()
        context.closePath()

        context.lineWidth = 3
        context.globalAlpha = 0.2
        context.beginPath()
        for (let x = xAxis.start; x < xAxis.max + xAxis.increment / 2.1; x += xAxis.increment) {
            let index = Math.round((x - xAxis.start) / xAxis.increment)
            if (index == 0) continue;

            let percentage = index / maxIndexX
            let x1 = (graphWidth - totalPadding * 2) * percentage
            context.moveTo(x1, 0)
            context.lineTo(x1, -(graphHeight - totalPadding * 2 + numberPadding / 2))
        }

        for (let y = yAxis.start; y < yAxis.max + yAxis.increment / 2.1; y += yAxis.increment) {
            let index = Math.round((y - yAxis.start) / yAxis.increment)
            if (index == 0) continue;

            let percentage = index / maxIndexY
            let y1 = -(graphHeight - totalPadding * 2) * percentage
            context.moveTo(0, y1)
            context.lineTo(graphWidth - totalPadding * 2 + numberPadding / 2, y1)
        }
        context.stroke()
        context.closePath()
        context.restore()

        const angle = Math.PI/6
        const sa = Math.sin(angle), ca = Math.cos(angle), ta = Math.tan(angle)

        context.save()
        context.textAlign = "left"
        context.rotate(angle)
        for (let x = xAxis.start; x < xAxis.max + xAxis.increment / 2.1; x += xAxis.increment) {
            let index = Math.round((x - xAxis.start) / xAxis.increment)
            let percentage = index / maxIndexX
            let value = xAxis.formatter ? xAxis.formatter(x) : Math.round(x)

            let w = (graphWidth - totalPadding * 2) * percentage + context.lineWidth / 2
            let x1 = w / ca
            let y1 = x1 * ta

            let k = y1 * sa
            let x2 = k * ca
            let y2 = k * sa

            let o = context.lineWidth + 3 + fontSize / 2
            let o1 = o * sa
            let o2 = o * ca

            context.fillText(value, x1 - x2 + o1, -(y1 - y2 - o2), (numberPadding * 1.2) / ta)
        }
        context.restore()

        context.save()
        context.textAlign = "right"
        for (let y = yAxis.start; y < yAxis.max + yAxis.increment / 2.1; y += yAxis.increment) {
            let index = Math.round((y - yAxis.start) / yAxis.increment)
            let percentage = index / maxIndexY
            let value = yAxis.formatter ? yAxis.formatter(y) : Math.round(y)
            context.fillText(value, -context.lineWidth - 3, -(graphHeight - totalPadding * 2) * percentage + fontSize / 2 - context.lineWidth / 2, numberPadding * 1.2)
        }
        context.restore()

        context.fillStyle = "#71C1FF"
        context.strokeStyle = "#71C1FF"

        context.beginPath()
        graphData.forEach(({x, y}, index) => {
            let indexX = (x - xAxis.start) / xAxis.increment
            let indexY = (y - yAxis.start) / yAxis.increment

            let percentageX = indexX / maxIndexX
            let percentageY = indexY / maxIndexY
            let localX = (graphWidth - totalPadding * 2) * percentageX
            let localY = -(graphHeight - totalPadding * 2) * percentageY
            if (index == 0) context.moveTo(localX, localY);
            else context.lineTo(localX, localY);
        })
        context.stroke()
        context.closePath()

        this.autoCropCanvas(context, 10)

        return graph
    }

    /**
     * Start typing
     * @param {Discord.TextChannel | Discord.DMChannel | Discord.Message} medium 
     * @param {number} count
     * @returns {Promise}
     */
    static startTyping(medium, count = 1) {
        let isMessage = medium instanceof Discord.Message
        let channel = isMessage ? medium.channel : medium
        return count > 1 ? channel.startTyping(count) : channel.startTyping()
    }

    /**
     * Stop typing
     * @param {Discord.TextChannel | Discord.DMChannel | Discord.Message} medium 
     * @param {boolean} force
     */
     static stopTyping(medium, force = false) {
        let isMessage = medium instanceof Discord.Message
        let channel = isMessage ? medium.channel : medium
        channel.stopTyping(force)
    }

    /**
     * DMs a user with the given text
     * @param {Discord.User} user
     * @param {Discord.APIMessageContentResolvable | Discord.MessageAdditions | (Discord.MessageOptions & {split?: false;})} content 
     * @returns {Promise<Discord.Message?>}
     */
    static dmUser(user, content) {
        return new Promise((resolve, reject) => {
            user.createDM().then(dmChannel => {
                this.sendMessage(dmChannel, content).then(resolve).catch(reject)
            }).catch(reject)
        })
    }

    /**
     * Replies to the message with the given text, includes error handling
     * @param {Discord.Message} message 
     * @param {Discord.APIMessageContentResolvable | Discord.MessageAdditions | (Discord.MessageOptions & {split?: false;})} content 
     * @returns {Promise<Discord.Message>}
     */
    static replyMessage(message, content) {
        return new Promise((resolve, reject) => {
            const stringAble = ["string", "number", "bigint", "boolean", "symbol"].includes(typeof content)
            if (stringAble) content = "\n" + content;
            
            let channel = message.channel
            if (channel instanceof Discord.DMChannel) {
                message.reply(content).then(resolve).catch(reject)
            } else {
                let hasPerms = this.hasPermissionsInChannel(message.guild.me, channel, ["SEND_MESSAGES"])
                if (hasPerms) {
                    message.reply(content).then(resolve).catch(e => {
                        reject(e)
                    })
                }
            }
        })
    }

    /**
     * Sends a message in the given channel, includes error handling
     * @param {Discord.TextChannel | Discord.DMChannel | Discord.Message} medium 
     * @param {Discord.APIMessageContentResolvable | Discord.MessageAdditions | (Discord.MessageOptions & {split?: false;})} content 
     * @returns {Promise<Discord.Message>}
     */
    static async sendMessage(medium, ...content) {
        return new Promise((resolve, reject) => {
            const stringAble = ["string", "number", "bigint", "boolean", "symbol"].includes(typeof content)
            if (stringAble) content = "\n" + content;

            let isMessage = medium instanceof Discord.Message
            let channel = isMessage ? medium.channel : medium
            if (channel instanceof Discord.DMChannel) {
                channel.send(...content).then(resolve).catch(reject)
            } else {
                let hasPerms = this.hasPermissionsInChannel(channel.guild.me, channel, ["SEND_MESSAGES"])
                if (hasPerms) {
                    channel.send(...content).then(resolve).catch(e => {
                        reject(e)
                    })
                }
            }
        })
    }

    /**
     * Replies to the message with the given warning text
     * @param {Discord.Message} message 
     * @param {string} warning 
     */
    static replyWarning(message, warning) {
        this.replyMessage(message, ":warning: " + warning).then(botMessage => {
            if (!botMessage || botMessage.channel instanceof Discord.DMChannel) return;
            botMessage.client.setTimeout(() => {
                botMessage.delete().catch(e => {
                    console.error(`replyWarning[deleteMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                })
            }, 15000)
        }).catch(e => {
            console.error(`replyWarning[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }

    /**
     * Sends a message in the given channel with the given warning text
     * @param {Discord.TextChannel | Discord.DMChannel | Discord.Message} medium 
     * @param {string} warning 
     */
    static sendWarning(medium, warning) {
        this.sendMessage(medium, ":warning: " + warning).then(botMessage => {
            if (!botMessage || botMessage.channel instanceof Discord.DMChannel) return;
            botMessage.client.setTimeout(() => {
                botMessage.delete().catch(e => {
                    console.error(`sendWarning[deleteMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                })
            }, 15000)
        }).catch(e => {
            console.error(`sendWarning[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }

    /**
     * Replies to the message with the given error text
     * @param {Discord.Message} message 
     * @param {string} error 
     */
    static replyError(message, error) {
        this.replyMessage(message, ":stop_sign: " + error).then(botMessage => {
            if (!botMessage || botMessage.channel instanceof Discord.DMChannel) return;
            botMessage.client.setTimeout(() => {
                botMessage.delete().catch(e => {
                    console.error(`replyError[deleteMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                })
            }, 15000)
        }).catch(e => {
            console.error(`replyError[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }

    /**
     * Sends a message in the given channel with the given error text
     * @param {Discord.TextChannel | Discord.DMChannel | Discord.Message} medium 
     * @param {string} error 
     */
    static sendError(medium, error) {
        this.sendMessage(medium, ":stop_sign: " + error).then(botMessage => {
            if (!botMessage || botMessage.channel instanceof Discord.DMChannel) return;
            botMessage.client.setTimeout(() => {
                botMessage.delete().catch(e => {
                    console.error(`sendError[deleteMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                })
            }, 15000)
        }).catch(e => {
            console.error(`sendError[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }

    /**
     * Replies to the message with a 'could not find' error
     * @param {Discord.Message} message 
     * @param {string} type 
     * @param {string} input 
     * @param {string} inObject
     */
    static couldNotFind(message, type, input, inObject = null) {
        const locale = message.guild ? message.guild.preferredLocale ?? "en-us" : "en-us"
        const lang = LocaleManager.getLang(locale)
        this.replyError(message, inObject ? lang.COULDNOTFIND.format(type.toLowerCase(), input) : lang.COULDNOTFIND_IN.format(type.toLowerCase(), input, inObject))
    }

    /**
     * Sends a "pages" message in the given channel
     * @param {Discord.Message} message
     * @param {(Discord.APIMessageContentResolvable | Discord.MessageAdditions | (Discord.MessageOptions & {split?: false;}))[]} pages
     * @param {number} startPage
     */
    static sendPages(message, pages, startPage = 0, timeout = 30, maxTime = 300) {
        if (timeout < 0) timeout = null;
        if (maxTime < 0) maxTime = null;

        console.assert(timeout || maxTime, "'timeout' and 'maxTime' cannot both be null.")

        const locale = message.guild ? message.guild.preferredLocale ?? "en-us" : "en-us"
        const lang = LocaleManager.getLang(locale)

        const client = message.client
        const author = message.author

        pages.forEach((page, index) => {
            if (!page.embed) return;

            page.embed.footer = page.embed.footer ?? {}

            page.embed.footer.text = lang.PAGE_NUM.format(index + 1, pages.length) + (page.embed.footer.text ? " | " + page.embed.footer.text : "")
            page.embed.footer.icon_url = author.avatarURL({
                size: 32,
                dynamic: true,
                format: "png"
            })
        })

        let page = startPage
        this.sendMessage(message, pages[page]).then(botMessage => {
            try {
                if (!botMessage || pages.length == 1 || botMessage.channel instanceof Discord.DMChannel) return;

                let emojis = ["arrow_backward", "arrow_forward"]
                if (pages.length > 2) {
                    emojis.push("previous_track", "next_track")
                }
                emojis.forEach((name, index) => {
                    let emoji = this.getEmoji(client, name)
                    emojis[index] = emoji
                    if (!botMessage || botMessage.deleted) return;
                    botMessage.react(emoji).catch(e => {
                        console.error(`Pages[addReaction]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                    })
                })

                if (!botMessage || botMessage.deleted) return;
                let collector = botMessage.createReactionCollector((reaction, user) => user.id == author.id, {time: maxTime * 1000, idle: timeout * 1000, dispose: true})

                collector.on("collect", (reaction, user) => {
                    if (!botMessage || botMessage.deleted) {
                        collector.stop()
                        return
                    };

                    reaction.users.remove(user).catch(e => {
                        console.error(`Pages[removeReaction]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                    })

                    let oldPage = page

                    if (this.areEmojisEqual(reaction.emoji, emojis[0])) {
                        page = page - 1 >= 0 ? page - 1 : pages.length - 1

                    } else if (this.areEmojisEqual(reaction.emoji, emojis[1])) {
                        page = page + 1 < pages.length ? page + 1 : 0

                    } else if (this.areEmojisEqual(reaction.emoji, emojis[2])) {
                        page = 0

                    } else if (this.areEmojisEqual(reaction.emoji, emojis[3])) {
                        page = pages.length - 1
                    }

                    if (page != oldPage) {
                        botMessage.edit(pages[page]).catch(e => {
                            console.error(`Pages[editMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                        })
                    }
                })

                collector.on("end", async () => {
                    if (!botMessage || botMessage.deleted) return;
                    botMessage.reactions.removeAll().catch(e => {
                        botMessage.reactions.cache.forEach(reaction => {
                            if (reaction && reaction.me) {
                                reaction.users.remove().catch(e => {
                                    console.error(`Pages[removeReaction]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                                })
                            }
                        })
                        console.error(`Pages[removeAllReactions]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                    })
                })
            } catch(e) {
                console.error(`Pages[stack]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
            }
        }).catch(e => {
            console.error(`Pages[sendMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
        })
    }

    /**
     * Checks if the member has the given permissions in the guild
     * @param {Discord.GuildMember} member 
     * @param {Array} permissions 
     * @returns {boolean}
     */
    static hasPermissions(member, permissions = []) {
        try {
            if (this.isDeveloper(member.user)) {
                return true
            }

            let flag = true
            permissions.forEach(permission => {
                if (!flag) return;

                if (permission == "DEV") {
                    if (member.id != this.isDeveloper(member.user)) flag = false;
                } else if (permission == "OWNER") {
                    if (member.id != member.guild.ownerID) flag = false;
                } else {
                    flag = member.hasPermission(permission, {checkAdmin: true, checkOwner: true})
                }
            })

            return flag
        } catch(e) {
            console.error(e)
        }
        return false
    }

    /**
     * Checks if the member has the given permissions in the channel
     * @param {Discord.GuildMember} member 
     * @param {Discord.GuildChannel} channel 
     * @param {Array} permissions 
     * @returns {boolean}
     */
    static hasPermissionsInChannel(member, channel, permissions = []) {
        try {
            let flag = true
            let memberPermissions = channel.permissionsFor(member)
            permissions.forEach(permission => {
                if (!flag) return;

                flag = memberPermissions.has(permission, true)
            })

            return flag
        } catch(e) {
            console.error(e)
        }
        return false
    }

    /**
     * Checks if the user is a developer
     * @param {Discord.User} user
     * @returns {boolean} 
     */
    static isDeveloper(user) {
        return LocalSettings.developers.includes(user.id)
    }

    /**
     * Checks whether the user is active on mobile
     * @param {Discord.User} user
     * @returns {boolean} 
     */
    static isOnMobile(user) {
        let status = user.presence.clientStatus
        if (!status) return false;
        return status.mobile && (!status.desktop || status.desktop == "dnd") && (!status.web || status.web == "dnd")
    }

    /**
     * Gets a member by a member resolvable
     * @param {Discord.Guild} guild
     * @param {Discord.Snowflake | Discord.Message | Discord.User} resolvable
     * @returns {Promise<Discord.GuildMember>} 
     */
    static getMember(guild, resolvable) {
        return guild.members.fetch(resolvable)
    }

    /**
     * Gets a guild by id
     * @param {Discord.Client} client
     * @param {string} id
     * @returns {Promise<Discord.Guild>} 
     */
    static getGuildById(client, id) {
        return client.guilds.fetch(id)
    }

    /**
     * Gets an emoji
     * @param {Discord.Client} client 
     * @param {string} input 
     * @returns {Discord.GuildEmoji?}
     */
    static getEmoji(client, input) {
        let find
        if (Object.values(unicodeEmojis).includes(input)) find = input;
        else find = unicodeEmojis[input];
        if (find) return find;

        client.emojis.cache.forEach(emoji => {
            if (!find && (emoji.name == input || emoji.name == unicodeEmojis[input])) find = emoji;
        })

        return find
    }

    /**
     * Gets an emoji by id
     * @param {Discord.Client} client 
     * @param {string} id 
     * @returns {Discord.GuildEmoji?}
     */
    static getEmojiById(client, id) {
        return client.emojis.cache.get(id)
    }

    /**
     * Checks if all given emojis are similar
     * @param {string | Discord.Emoji} emojis 
     * @returns {boolean}
     */
    static areEmojisEqual(...emojis) {
        emojis.forEach((emoji, index) => {
            if (emoji instanceof Discord.Emoji) {
                emojis[index] = emoji.name
            } else if (typeof emoji == "string") {
                let unicode = unicodeEmojis[emoji]
                if (unicode) emojis[index] = unicode;
            }
        })
        
        return emojis.filter(emoji => emoji == emojis[0]).length == emojis.length
    }

    /**
     * Gets a channel
     * @param {Discord.Guild} guild
     * @param {string} name 
     * @param {string} type
     * @returns {Discord.GuildChannel?} 
     */
    static getChannel(guild, name, type) {
        let find
        guild.channels.cache.forEach(channel => {
            if (!find && channel.name == name
                && (!type || channel.type == type)
                && channel.viewable) find = channel;
        })
        return find
    }

    /**
     * Gets a channel by id
     * @param {Discord.ChannelManager | Discord.GuildChannelManager} channels
     * @param {string} id
     * @returns {Discord.GuildChannel?} 
     */
    static getChannelById(channels, id) {
        let channel = channels.cache.get(id)
        if (channel && channel.viewable) return channel;
    }

    /**
     * Gets the channel with highest priority for alerts
     * @param {Discord.Guild} guild
     * @returns {Discord.GuildChannel?} 
     */
    static getPriorityChannel(guild, check) {
        try {
            let channel = this.getChannelById(guild.channels, guild.systemChannelID)
            if (channel && channel.viewable && ((check && check(channel)) || !check)) return channel;
            channel = null
            
            let attemptNames = ["general", "chat", "commons", "discussion", "off-topic", "off-topic-general", "commands", "bot-cmds", "bot-commands", "announcements"]
            attemptNames.forEach(name => {
                if (channel) return;
                channel = this.getChannel(guild, name, "text")
                if (channel && (!channel.viewable || (check && !check(channel)))) channel = null;
            })
            return channel
        } catch(e) {
            console.error(e)
        }
    }

    /**
     * Gets a message from a channel by id
     * @param {Discord.TextChannel} channel
     * @param {string} id
     * @returns {Promise<Discord.Message>} 
     */
    static getMessageInChannel(channel, id) {
        return new Promise((resolve, reject) => {
            const messages = channel.messages
            if (!channel.viewable) return reject(new Error("Not viewable"));
            let message = messages.cache.get(id)
            if (message) resolve(message);
            messages.fetch(id).then(resolve).catch(reject)
        })
    }

    /**
     * Gets the message before the provided message id
     * @param {Discord.TextChannel} channel
     * @param {string} id
     * @returns {Promise<Discord.Message>} 
     */
    static getPreviousMessage(channel, id) {
        return new Promise((resolve, reject) => {
            if (!channel.viewable) return reject(new Error("Not viewable"));
            channel.messages.fetch({
                limit: 1,
                before: id
            }).then(messages => {
                let message = messages instanceof Discord.Collection ? messages.last() : messages
                resolve(message)
            }).catch(reject)
        })
    }

    /**
     * Checks if one of the provided strings is equal to a recent message in the channel
     * @param {Discord.TextChannel} channel 
     * @param  {...string} text 
     * @returns {Promise<Discord.Message>}
     */
    static getRecentMessage(channel, ...text) {
        return new Promise((resolve, reject) => {
            if (!channel.viewable) return reject(new Error("Not viewable"));
            channel.messages.fetch({limit: 15}).then((messages) => {
                let find
                messages.each(message => {
                    if (find) return;
                    if (text.includes(message.content)) {
                        find = message
                    }
                })
                resolve(find)
            }).catch(reject)
        })
    }

    /**
     * Checks if one of the provided strings is equal to a recent message in the channel
     * @param {Discord.TextChannel} channel 
     * @param  {...string} text 
     * @returns {Promise<Discord.Message>}
     */
    static getRecentMessageContaining(channel, ...text) {
        return new Promise((resolve, reject) => {
            if (!channel.viewable) return reject(new Error("Not viewable"));
            channel.messages.fetch({limit: 15}).then(messages => {
                let find
                messages.each(message => {
                    if (find) return;
                    text.forEach(string => {
                        if (find) return;
                        if (message.content.includes(string)) {
                            find = message
                        }
                    })
                })
                resolve(find)
            }).catch(reject)
        })
    }

    /**
     * Checks if one of the provided strings is equal to a recent message in the channel
     * @param {Discord.TextChannel} channel 
     * @param {Discord.User} user 
     * @param {number} count
     * @param {function?} check
     * @returns {Promise<Discord.Message[]>}
     */
    static getRecentMessagesFrom(channel, user, count = 1, check) {
        return new Promise(async (resolve, reject) => {
            if (!channel.viewable) return reject(new Error("Not viewable"));
            let messages = []
            let cycle = 0
            let leastMessage
            while (messages.length < count) {
                let msgs = await channel.messages.fetch({
                    before: cycle > 0 ? leastMessage.id : null
                })

                if (!msgs || msgs.size == 0) break;

                if (msgs instanceof Discord.Message) {
                    let message = msgs
                    msgs = new Discord.Collection()
                    msgs.set(message.id, message)
                }

                msgs.each(message => {
                    if (messages.length >= count) return;
                    if (!leastMessage || message.createdTimestamp < leastMessage.createdTimestamp) {
                        leastMessage = message
                    }

                    if (message.author.id == user.id && (!check || (check && check(message)))) {
                        messages.push(message)
                    }
                })

                cycle++
            }
            resolve(messages)
        })
    }

    /**
     * Checks if one of the provided strings is equal to a recent message in the channel
     * @param {Discord.TextChannel} channel 
     * @param {Discord.User} user 
     * @param {number} timestamp
     * @param {function?} check
     * @returns {Promise<Discord.Message[]>}
     */
     static getRecentMessagesAfter(channel, user, timestamp, check) {
        return new Promise(async (resolve, reject) => {
            if (!channel.viewable) return reject(new Error("Not viewable"));
            let messages = []
            let cycle = 0
            let leastMessage
            while (true) {
                let msgs = await channel.messages.fetch({
                    before: cycle > 0 ? leastMessage.id : null
                })

                if (!msgs || msgs.size == 0) break;

                if (msgs instanceof Discord.Message) {
                    let message = msgs
                    msgs = new Discord.Collection()
                    msgs.set(message.id, message)
                }

                let flag = false
                msgs.each(message => {
                    if (message.createdTimestamp < timestamp) {
                        flag = true
                        return
                    }
                    if (!leastMessage || message.createdTimestamp < leastMessage.createdTimestamp) {
                        leastMessage = message
                    }

                    if (message.author.id == user.id && (!check || (check && check(message)))) {
                        messages.push(message)
                    }
                })
                if (flag) break;

                cycle++
            }
            resolve(messages)
        })
    }

    /**
     * Checks if message1 is more recent than message2
     * @param {Discord.Message} message1 
     * @param  {Discord.Message} message2
     * @returns {boolean}
     */
    static isMessageMoreRecent(message1, message2) {
        return message1.createdTimestamp - message2.createdTimestamp > 0
    }

    /**
     * Gets a standard embed footer object
     * @param {Discord.Client} client 
     * @returns {Object}
     */
    static getFooter(message, hasUptime = true) {
        const client = message.client
        const locale = message.guild ? message.guild.preferredLocale ?? "en-us" : "en-us"
        const lang = LocaleManager.getLang(locale)
        return {
            text: `${hasUptime ? `${lang.UPTIME}: ${lang.TIME_FORMAT.format(Math.floor(client.uptime / 1000 / 3600), Math.floor((client.uptime / 1000 / 60) % 60), Math.floor(client.uptime / 1000 % 60))} | ` : ""}${lang.COPYRIGHT.format((new Date()).getUTCFullYear())} (${lang.language_native})`
        }
    }

    /**
     * Gets a role
     * @param {Discord.Guild} guild
     * @param {string} name 
     * @returns {Promise<Discord.Role>} 
     */
    static getRole(guild, name) {
        return new Promise((resolve, reject) => {
            guild.roles.fetch().then(roles => {
                let find
                roles.cache.each(role => {
                    if (!find && role.name == name) find = role;
                })
                resolve(find)
            }).catch(reject)
        })
    }

    /**
     * Gets a channel by id
     * @param {Discord.Guild} guild
     * @param {string} id
     * @returns {Promise<Discord.Role>} 
     */
    static getRoleById(guild, id) {
        return guild.roles.fetch(id)
    }

    /**
     * Parses the provided input to find a channel
     * @param {Discord.Guild} guild
     * @param {string} input
     * @returns {Discord.GuildChannel} 
     */
    static parseChannel(guild, input) {
        input = input.replace(/^<#/, "").replace(/>$/, "")
        let find = this.getChannelById(guild.channels, input)
        if (find) return find;
        return this.getChannel(guild, input)
    }

    /**
     * Parses the provided input to find an emoji
     * @param {Discord.Client} client
     * @param {string} input
     * @returns {Discord.GuildEmoji | Discord.ReactionEmoji | Discord.Emoji} 
     */
    static parseEmoji(client, input) {
        input = input.replace(/^<:.+:/, "").replace(/>$/, "")
        let find = this.getEmojiById(client, input)
        if (find) return find;
        return this.getEmoji(client, input)
    }

    /**
     * Parses the provided input to find a role
     * @param {Discord.Guild} guild
     * @param {string} input
     * @returns {Promise<Discord.Role>} 
     */
    static async parseRole(guild, input) {
        input = input.replace(/^<@&/, "").replace(/>$/, "")
        return new Promise((resolve, reject) => {
            this.getRoleById(guild, input).then(find => {
                if (find) return resolve(find);
                this.getRole(guild, input).then(find => {
                    return resolve(find);
                }).catch(reject)
            }).catch(reject)
        })
    }

    /**
     * Parses the provided input and creates a new Date object
     * @param {string} input
     * @returns {Date} 
     */
    static parseDate(input, lang) {
        let number = Number(input)
        let date = !isNaN(number) ? new Date(number) : new Date(input)
        date = isNaN(date) ? null : date

        if (!date) {
            let currentDate = new Date()
            let namedDates = {
                [lang[TIME_KEYWORD_HALFHOUR]]: new Date(Date.now() - 1800000),
                [lang[TIME_KEYWORD_LASTHOUR]]: new Date(Date.now() - 3600000),
                [lang[TIME_KEYWORD_TODAY]]: new Date(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()),
                [lang[TIME_KEYWORD_YESTERDAY]]: new Date(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() - 1),
                [lang[TIME_KEYWORD_THISWEEK]]: new Date(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() - currentDate.getUTCDay()),
                [lang[TIME_KEYWORD_LASTWEEK]]: new Date(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() - currentDate.getUTCDay() - 7),
            }
            date = namedDates[input.toLowerCase().trim().replace(/ /g, "")]
        }

        return date
    }
}

module.exports = Util