const Util = require("./util.js");

class Mojang {
    constructor() {
        console.error(`The ${this.constructor.name} class cannot be constructed.`);
    }

    /**
     * Get the status of one or all mojang services
     * @param {string} checkDomain 
     * @returns {Promise<Object | string>}
     */
    static async getStatus(checkDomain = null) {
        let result = await Util.requestAsync("https://status.mojang.com/check");
        result = JSON.parse(result);

        let statuses = {}
        result.forEach(domain => {
            statuses[Object.keys(domain)[0]] = Object.values(domain)[0]
        })

        if (!checkDomain) return statuses;
        return statuses[checkDomain] ? statuses[checkDomain] : "grey"
    }

    /**
     * Check if string is a valid uuid
     * @param {string} uuid 
     * @param {boolean} hyphens 
     * @returns {boolean}
     */
    static isUUID(uuid, hyphens) {
        if (!uuid) return false;
        if (hyphens) return /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(uuid);
        return /^[0-9A-F]{8}[0-9A-F]{4}[4][0-9A-F]{3}[89AB][0-9A-F]{3}[0-9A-F]{12}$/i.test(uuid)
    }

    /**
     * Get UUID of a user
     * @param {string} username 
     */
    static async getUUID(username) {
        let result = await Util.requestAsync(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        if (!result) return null;

        result = JSON.parse(result);
        return result.id;
    }

    static async getNameHistory(uuid) {
        let result = await Util.requestAsync(`https://api.mojang.com/user/profiles/${uuid}/names`);
        result = JSON.parse(result);
        if (!result) return null;
        
        let history = {
            current: result[result.length - 1].name,
            original: result[0].name,
            changes: result.reverse()
        }
        return history;
    }

    static async getUserDatas(...usernames) {
        let result = await Util.requestAsync({
            hostname: "api.mojang.com",
            path: "/profiles/minecraft",
            protocol: "HTTPS",
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify(usernames)
        })
        
        return JSON.parse(result)
    }
}

module.exports = Mojang