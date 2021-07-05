const InputManager = require("./InputManager")
const { InputManagerTypes } = require("./Constants")

//const Types = require("../../typings")

/**
 * Manages button inputs for a message
 * @class
 * @extends {Types.InputManager}
 */
class ButtonInputManager extends InputManager {
    constructor(message, filter) {
        super(message, filter)

        /**
         * The input manager type
         * @readonly
         * @type {string}
         */
        this.type = InputManagerTypes.BUTTON
    }

    /**
     * @override
     * @private
     */
    _handleInput(button) {
        return button
    }

    /**
     * Starts collecting button inputs for the message
     * @param {number} maxTime
     * @param {number} idleTimeout
     * @returns {this}
     */
    start(maxTime = 300, idleTimeout = 30) {
        if (maxTime < 0) maxTime = null
        if (idleTimeout < 0) idleTimeout = null

        console.assert(
            idleTimeout || maxTime,
            "BUTTON_INPUT_MANAGER_ERROR: 'maxTime' and 'idleTimeout' cannot both be null."
        )

        let collector = this.message.createButtonCollector(this.filter, {
            time: maxTime * 1000,
            idle: idleTimeout * 1000,
            dispose: true,
        })
        this.setCollector(collector)

        return this
    }
}

module.exports = ButtonInputManager
