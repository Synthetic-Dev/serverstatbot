const NodeCache = require("node-cache")

//const Types = require("../../typings")

/**
 * Manages a cache of images
 * @class
 */
class ImageManager {
    /**
     * A dictionary of all image managers
     * @private
     * @type {Types.ImageManagers}
     */
    static managers = {}

    /**
     * Gets an image manager or creates one if it doesn't exist
     * @param {string} name
     * @param {number} ttl
     * @returns {Types.ImageManager}
     */
    static getManager(name, ttl) {
        name = name.toLowerCase()
        let manager = this.managers[name]
        if (manager) return manager

        manager = new ImageManager(ttl)
        this.managers[name] = manager
        return manager
    }

    /**
     * Creates a new ImageManager
     * @constructor
     * @param {number} stdTTL
     */
    constructor(stdTTL = 600) {
        /**
         * The standard ttl
         * @private
         * @readonly
         * @type {number}
         */
        this.stdTTL = stdTTL

        /**
         * The cache for this image manager
         * @private
         * @type {NodeCache}
         */
        this.cache = new NodeCache({
            stdTTL: stdTTL,
            checkperiod: stdTTL / 2,
            useClones: false,
        })
    }

    /**
     * Gets an image with the given key
     * @param {NodeCache.Key} key
     * @returns {any}
     */
    get(key) {
        return this.cache.get(key)
    }

    /**
     * Sets/resets the ttl of an image
     * @param {NodeCache.Key} key
     * @param {number} ttl
     * @returns {boolean}
     */
    ttl(key, ttl = this.stdTTL) {
        return this.cache.ttl(key, ttl)
    }

    /**
     * Adds a new image to the cache
     * @param {NodeCache.Key} key
     * @param {any} value
     * @param {number} ttl
     * @returns {boolean}
     */
    set(key, value, ttl) {
        return this.cache.set(key, value, ttl)
    }
}

module.exports = ImageManager
