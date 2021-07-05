const Discord = require("discord.js")
const { MessageButton, MessageActionRow } = require("discord-buttons")

const Util = require("../utils/Util")

const MessageBase = require("./MessageBase")
const ButtonInputManager = require("./ButtonInputManager")
//const Types = require("../../typings")

/**
 * Custom pages message class
 * @class
 * @extends {Types.MessageBase}
 */
class MessagePages extends MessageBase {
    /**
     * Creates a new pages message instance
     * @constructor
     * @param {Types.MessagePagesOptions} data
     */
    constructor(data = {}) {
        super(data)

        /**
         * The user that the interactions will be limited to
         * @protected
         * @type {Discord.User}
         */
        this.user = data.user ?? (data.message ? data.message.author : null)

        /**
         * The array of pages that will be posted
         * @readonly
         * @type {MessagePagesContent[]}
         */
        this.pages = data.pages ?? []

        /**
         * The page that is currently set
         * @protected
         * @type {MessagePagesContent}
         */
        this.currentPage = data.pages ? data.pages[0] : null

        /**
         * The index of the current page
         * @protected
         * @type {number}
         */
        this.currentPageIndex = 0

        /**
         * The maximum amount of time the input manager will take inputs for
         * @type {number}
         */
        this.maxTime = data.maxTime ?? 300

        /**
         * The amount of time the input manager will wait until ending if there are no more inputs
         * @type {number}
         */
        this.idleTimeout = data.idleTimeout ?? 30
    }

    /**
     * Add multiple pages
     * @param  {...Types.MessagePagesContent} pages
     * @returns {this}
     */
    addPages(...pages) {
        if (pages.length == 0) return
        if (this.sent)
            throw new Error("MESSAGE_PAGES_ERROR: Pages have already been sent")

        if (pages.length == 1 && pages[0] instanceof Array) {
            pages = pages.shift()
        }

        let formattedPages = []
        pages.forEach((page) => {
            let formattedPage = page
            if (page instanceof Discord.MessageEmbed) {
                formattedPage = { embed: page }
            } else if (page instanceof Discord.MessageAttachment) {
                formattedPage = { files: [page] }
            } else if (!(page instanceof Object)) {
                formattedPage = { content: page }
            }

            formattedPages.push(formattedPage)
        })

        this.pages.push(...formattedPages)

        return this
    }

    /**
     * Add a page
     * @param {Types.MessagePagesContent} page
     * @returns {this}
     */
    addPage(page) {
        this.addPages(page)
        return this
    }

    /**
     * Clear the pages
     * @param {boolean} remove
     * @returns {this}
     */
    dumpPages(remove = false) {
        this.pages = []

        if (remove && this.message) {
            if (!this.message.deleted) this.message.delete().catch((e) => {})
            this.message = null
        }

        return this
    }

    /**
     * Sets the current page to be displayed. The index starts at zero
     * @param {number} index
     * @returns {this}
     */
    setCurrentPage(index) {
        this.currentPageIndex = Math.clamp(index, 0, this.pages.length - 1)
        this.currentPage = this.pages[this.currentPageIndex]
        return this
    }

    /**
     * Sets the maximum amount of time that inputs will be collected for
     * @param {number} time
     * @returns {this}
     */
    setMaxTime(time = 300) {
        this.maxTime = time
        return this
    }

    /**
     * Sets the amount of time after an input that inputs will no longer be collected
     * @param {number} time
     * @returns {this}
     */
    setIdleTimeout(time = 30) {
        this.idleTimeout = time
        return this
    }

    /**
     * Sends the pages message to the channel
     * @protected
     * @param {Discord.TextChannel} channel
     * @param {Discord.User} user
     * @param {number} pageIndex
     * @returns {this}
     */
    send(
        channel = this.channel,
        user = this.user,
        pageIndex = this.currentPageIndex
    ) {
        if (this.sent)
            throw new Error("MESSAGE_PAGES_ERROR: Pages have already been sent")
        if (!channel)
            throw new Error("MESSAGE_PAGES_ERROR: No channel has been provided")

        this.channel = channel
        this.user = user

        if (this.pages.length > 0) {
            this.pages.forEach((page, index) => {
                if (user && page.embed) {
                    const embed = page.embed
                    embed.footer = embed.footer ?? {}

                    let text = embed.footer.text ?? user.tag

                    if (embed instanceof Discord.MessageEmbed) {
                        embed.setFooter(
                            text,
                            user.avatarURL({
                                size: 32,
                                dynamic: true,
                                format: "png",
                            })
                        )
                    } else {
                        embed.footer.text = text
                        embed.footer.icon_url = user.avatarURL({
                            size: 32,
                            dynamic: true,
                            format: "png",
                        })
                    }
                }

                let components =
                    page.components ?? (page.component ? [page.component] : [])
                if (components.length >= 5)
                    throw new Error(
                        "MESSAGE_PAGES_ERROR: Page has 5 or more components, buttons cannot be added"
                    )

                let row = new MessageActionRow()

                let pageNum = new MessageButton()
                    .setStyle("blurple")
                    .setLabel(`${index + 1}/${this.pages.length}`)
                    .setID("pages_label")

                let back = new MessageButton()
                    .setStyle("red")
                    .setLabel("Back")
                    .setID("pages_back")

                let next = new MessageButton()
                    .setStyle("green")
                    .setLabel("Next")
                    .setID("pages_next")

                let start, end
                if (this.pages.length > 3) {
                    start = new MessageButton()
                        .setStyle("grey")
                        .setLabel("")
                        .setEmoji("848904242918850571")
                        .setID("pages_start")

                    end = new MessageButton()
                        .setStyle("grey")
                        .setLabel("")
                        .setEmoji("848904243154124821")
                        .setID("pages_end")
                }

                row.addComponent(pageNum)
                if (start) row.addComponent(start)
                row.addComponents(back, next)
                if (end) row.addComponent(end)

                components.unshift(row)
                page.components = components
            })
        }

        if (!this.currentPage) this.setCurrentPage(pageIndex)
        if (!this.currentPage)
            throw new Error(
                "MESSAGE_PAGES_ERROR: No page could be found to be sent"
            )

        this.sent = true
        Util.sendMessage(channel, this.currentPage)
            .then((message) => {
                this.message = message
                if (this.pages.length == 1) return

                let filter
                if (user) filter = (button) => button.clicker.user.id == user.id

                let manager = new ButtonInputManager(message, filter)
                    .on("input", (button) => {
                        let oldPageIndex = pageIndex

                        switch (button.id) {
                            case "pages_back":
                                pageIndex =
                                    pageIndex - 1 >= 0
                                        ? pageIndex - 1
                                        : this.pages.length - 1
                                break
                            case "pages_next":
                                pageIndex =
                                    pageIndex + 1 < this.pages.length
                                        ? pageIndex + 1
                                        : 0
                                break
                            case "pages_start":
                                pageIndex = 0
                                break
                            case "pages_end":
                                pageIndex = this.pages.length - 1
                                break
                            default:
                                break
                        }

                        button.reply.defer()
                        if (pageIndex == oldPageIndex) return
                        this.setCurrentPage(pageIndex)

                        if (this.message)
                            this.message.edit(this.currentPage).catch((e) => {
                                Util.error(e, "MessagePages", "editMessage1")
                            })
                    })
                    .on("end", () => {
                        let page = this.currentPage
                        page.components.forEach((component) => {
                            component.components.forEach((button) => {
                                if (!(button instanceof MessageButton)) return
                                button.setDisabled(true)
                            })
                        })

                        if (this.message)
                            this.message.edit(page).catch((e) => {
                                Util.error(e, "MessagePages", "editMessage2")
                            })
                    })
                    .start(this.maxTime, this.idleTimeout)
            })
            .catch((e) => {
                Util.error(e, "MessagePages", "sendMessage")
            })

        return this
    }
}

module.exports = MessagePages
