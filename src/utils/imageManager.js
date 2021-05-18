const NodeCache = require("node-cache")

class ImageManager {

    static managers = {};

    static getManager(name, ttl) {
        name = name.toLowerCase()
        let manager = this.managers[name]
        if (manager) return manager;

        manager = new ImageManager(ttl)
        this.managers[name] = manager
        return manager
    }

    constructor(stdTTL = 600) {
        this.cache = new NodeCache({
            stdTTL: stdTTL,
            checkperiod: stdTTL / 2,
            useClones: false
        })
    }

    get(key) {
        return this.cache.get(key)
    }

    ttl(key, ttl) {
        return this.cache.ttl(key, ttl)
    }

    set(key, value, ttl) {
        return this.cache.set(key, value, ttl)
    } 
}

module.exports = ImageManager