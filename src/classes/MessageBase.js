const Discord = require("discord.js")

const Util = require("../utils/Util")

//const Types = require("../../typings")

/**
 * The base class for custom messages
 * @class
 */
class MessageBase {
    /**
     * Creates a base custom message instance
     * @constructor
     * @param {Types.MessageBaseOptions} data
     */
    constructor(data = {}) {
        /**
         * The channel the message will be posted in
         * @protected
         * @type {Discord.TextChannel}
         */
        this.channel =
            data.channel ?? (data.message ? data.message.channel : null)

        /**
         * The message containing the content (if already posted)
         * @protected
         * @type {Discord.Message?}
         */
        this.message = null

        /**
         * Whether the message has already been sent
         * @readonly
         * @type {boolean}
         */
        this.sent = false

        /**
         * Whether the message has been deleted
         * @readonly
         * @type {boolean}
         */
        this.deleted = false
    }

    /**
     * Sends content to a channel
     * @protected
     * @param {string} content
     * @param {Discord.TextChannel} channel
     * @returns {this}
     */
    send(content, channel = this.channel) {
        if (this.sent)
            throw new Error("MESSAGE_BASE_ERROR: Content has already been sent")
        if (!channel)
            throw new Error("MESSAGE_BASE_ERROR: No channel has been provided")
        if (!content)
            throw new Error("MESSAGE_BASE_ERROR: No content has been provided")

        this.channel = channel

        this.sent = true
        Util.sendMessage(channel, content)
            .then((message) => {
                this.message = message
            })
            .catch((e) => {
                Util.error(e, "MessageBase", "sendMessage")
            })

        return this
    }

    /**
     * Deletes the message from the channel
     * @returns {this}
     */
    delete() {
        if (this.deleted)
            throw new Error(
                "MESSAGE_BASE_ERROR: Message has already been deleted"
            )
        if (!this.message)
            throw new Error("MESSAGE_BASE_ERROR: Message has not yet been sent")

        this.deleted = true

        if (this.message && !this.message.deleted) {
            this.message.delete().catch((e) => {
                Util.error(e, "MessageBase", "deleteMessage")
            })
        }
        this.message = null

        return this
    }
}

module.exports = MessageBase
