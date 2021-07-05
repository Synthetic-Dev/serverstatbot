const EventEmitter = require("events")
const Discord = require("discord.js")

//const Types = require("../../typings")

/**
 * Manages inputs from a Collector
 * @abstract
 * @extends {EventEmitter}
 */
class InputManager extends EventEmitter {
    /**
     * Constructs an input manager instance
     * @constructor
     * @param {Discord.Message} message
     * @param {Types.InputFilter} filter
     * @returns
     */
    constructor(message, filter = () => true) {
        super()

        if (!message)
            throw new Error("INPUT_MANAGER_ERROR: No message provided")
        if (message.author.id != message.client.user.id)
            throw new Error(
                "INPUT_MANAGER_ERROR: Message author does not match local user"
            )

        /**
         * The filter for user inputs
         * @private
         * @type {Types.InputFilter}
         */
        this.filter = filter

        /**
         * The message to capture the inputs from
         * @readonly
         * @type {Discord.Message}
         */
        this.message = message

        /**
         * The collector that collects all the user inputs
         * @private
         * @type {Discord.Collector}
         */
        this.collector = null

        /**
         * Whether the input manager has been deleted or the message has been deleted
         * @readonly
         * @type {boolean}
         */
        this.deleted = false
    }

    /**
     * @private
     */
    _handleInput(...args) {
        return [...args]
    }

    /**
     * Set the collector of this input manager
     * @param {Discord.Collector<Discord.Snowflake, any>} collector
     * @returns {this}
     * @emits InputManager#input
     * @emits InputManager#end
     */
    setCollector(collector) {
        if (this.deleted)
            throw new Error(
                "INPUT_MANAGER_ERROR: This input manager is deleted"
            )
        if (!this.message || this.message.deleted) return this.delete()

        if (this.collector) this.collector.stop()
        this.collector = collector

        collector.on("collect", (...args) => {
            if (this.deleted) return
            if (!this.message || this.message.deleted) return this.delete()
            let event = this._handleInput(...args)
            this.emit("input", event)
        })

        collector.on("end", () => {
            if (this.deleted) return
            if (!this.message || this.message.deleted) return
            this.emit("end")
            this.delete()
        })

        return this
    }

    /**
     * Deletes this input manager
     * @returns {this}
     * @emits InputManager#delete
     */
    delete() {
        if (this.deleted)
            throw new Error(
                "INPUT_MANAGER_ERROR: This input manager has already been deleted"
            )
        this.deleted = true

        if (this.collector) this.collector.stop()
        this.collector = null
        this.emit("delete")

        return this
    }
}

module.exports = InputManager
