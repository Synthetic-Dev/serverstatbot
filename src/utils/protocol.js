const MinecraftUtil = require("minecraft-server-util")
const NodeCache = require("node-cache")

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

const queryMod = __importDefault(require("./queryFullModified.js")).default

const cacheTime = 30;
const requestCache = new NodeCache({
    checkperiod: cacheTime / 2,
    stdTTL: cacheTime,
    useClones: true
});

let sessionCount = 0

class Protocol {
    constructor() {
        console.error(`The ${this.constructor.name} class cannot be constructed.`);
    }

    static maxPort = 65535;
    static blockedHosts = ["0.0.0.0", "localhost", "127.0.0.1"];

    /**
     * The minimum minecraft version that the statusFE01() handshake supports
     * @returns {string}
     */
    static getMinSupportedVersion() {
        return "1.4.2"
    }

    static getErrorType(error) {
        if (!error) return "offline";
        
        if (["Failed to retrieve the status of the server within time", "Failed to query server within time"].includes(error.message) || error.code == "ETIMEDOUT" || error.code == "EHOSTUNREACH" || error.code == "ECONNREFUSED") {
            return "offline"
        } else if (error.code == "ENOTFOUND") {
            return "notfound"
        } else if (error.message == "Server sent an invalid packet type") {
            return "badport"
        } else if (error.message == "Blocked host") {
            return "blocked"
        }
        return "unknown"
    }

    static isIpValid(ip) {
        const validIp_HostnameRegex = /^(((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|((([a-zA-Z]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\‌​-]*[A-Za-z0-9])))$/g
        return validIp_HostnameRegex.test(ip)
    }

    /*
    static queryRace(ip, options) {
        options.timeout = options.timeout ?? 5000;
        return queryMod(ip, options)

        return new Promise(async (resolve, reject) => {
            let timeout
            timeout = setTimeout(() => {
                reject(new Error("Failed to query server within time"))
                clearTimeout(timeout)
            }, options.timeout)

            queryMod(ip, options)//MinecraftUtil.queryFull(ip, options)
            .then(resolve).catch(reject)
        })
    }*/

    /**
     * Send requests to server to get all available information
     * @private Use getInfo() for formatted data
     * @param {string} ip 
     * @param {number} port 
     * @param {number} queryPort
     * @returns {Promise<boolean, Object<string, any> | Error | string>}
     */
    static async sendRequest(ip, port = 25565, queryPort = port) {
        if (this.blockedHosts.includes(ip.toLowerCase())) return [false, new Error("Blocked host")];
        if (port > this.maxPort) return [false, new Error("Port exceeds maximum")];
        if (queryPort > this.maxPort) return [false, new Error("Query port exceeds maximum")];

        let bulkData = new Promise(resolve => {
            let args = [ip, {port: port, timeout: 3000}]

            function query(statusResponse) {
                if (statusResponse) statusResponse.bedrock = !!statusResponse.bedrock;

                sessionCount++
                args[1].port = queryPort
                args[1].sessionID = sessionCount
                args[1].timeout = 5000

                queryMod(...args).then(queryResponse => {
                    queryResponse.query = true;
                    queryResponse.ping = statusResponse != null;

                    if (statusResponse) {
                        Object.keys(statusResponse).forEach(key => {
                            let value = statusResponse[key]
                            if (queryResponse[key] == null) {
                                queryResponse[key] = value
                            }

                            if (value instanceof MinecraftUtil.Description) {
                                if (queryResponse[key].descriptionText == "") {
                                    queryResponse[key] = value
                                }
                            }
                        })
                    } else {
                        queryResponse.bedrock = queryResponse.edition == "MCPE" || queryResponse.serverGUID != null
                    }
                    resolve([true, queryResponse])
                }).catch(e => {
                    if (statusResponse) {
                        statusResponse.query = false;
                        statusResponse.ping = true;
                        resolve([true, statusResponse])
                    } else resolve([false, e]);
                })
            }

            function attemptBedrock() {
                MinecraftUtil.statusBedrock(...args).then(response => {
                    response.bedrock = true;
                    query(response)
                }).catch(() => {query()})
            }

            if (port == 19132) attemptBedrock()
            else {
                MinecraftUtil.status(...args).then(query).catch(e => {
                    if (!e) query()
                    else if (e.message == "Failed to retrieve the status of the server within time") {
                        MinecraftUtil.statusFE01(...args).then(query).catch(() => {query()})
                    } else if (e.code == "ECONNREFUSED" && port != 25565) attemptBedrock()
                    else resolve([false, e]);
                })
            }
        })

        let [success, result] = await bulkData
        if (!success) return [false, result];

        result.cached = false;
        result.latency = result.roundTripLatency ?? -1;
        result._description = {
            raw: [],
            text: {
                raw: "A Minecraft Server",
                clean: "A Minecraft Server"
            },
            ansi: null,
            default: true
        }

        if (result.motdLine1) result._description.raw.push(result.motdLine1);
        if (result.motdLine2) result._description.raw.push(result.motdLine2);
        if (result.description) result._description.raw.push(result.description);

        result.description = result._description
        delete result._description

        if (result.description.raw.length > 0) {
            let desc = result.description
            desc.text.raw = []
            desc.text.clean = []
            desc.raw.forEach(d => {
                if (!d) return;
                desc.text.raw.push(d.toString())
                desc.text.clean.push(d.toRaw())
            })
            desc.text.raw = desc.text.raw.join("\n")
            desc.text.clean = desc.text.clean.join("\n").trim()

            if (desc.text.raw != "") {
                desc.default = false
            } else {
                desc.text.raw = "A Minecraft Server"
                desc.text.clean = "A Minecraft Server"
            }
        }

        return [true, result]
    }

    /**
     * Ping a minecraft server to get its details
     * @param {string} ip 
     * @param {number} port 
     * @param {number} queryPort
     * @returns {Promise<Object<string, any>}
     */
    static async getInfo(ip, port = 25565, queryPort = port) {
        if (queryPort < 0) queryPort = port;

        let final
        let cacheKey = ip + ":" + port + "/" + queryPort
        if (requestCache.has(cacheKey)) {
            final = requestCache.get(cacheKey)
            final.cached = true;
            return final
        }

        let [success, result] = await this.sendRequest(ip, port, queryPort)

        if (success) {
            let players = result.players ? result.players : result.samplePlayers ? result.samplePlayers : []
            players.forEach((player, index) => {
                if (typeof player == "string") {
                    players[index] = {
                        id: null,
                        name: {
                            raw: player,
                            clean: player.replace(/§./g, "").trim()
                        }
                    } 
                } else {
                    const name = player.name
                    player.name = {
                        raw: name,
                        clean: name.replace(/§./g, "").trim()
                    }
                }
            })

            players.sort((a, b) => (a.name.clean > b.name.clean) ? 1 : ((b.name.clean > a.name.clean) ? -1 : 0))

            final = {
                ip: result.host,
                port: result.port,
                queryPort: queryPort,
                latency: result.latency,
                online: true,
                ping: result.ping,
                query: result.query,
                cached: result.cached,
                bedrock: result.bedrock,
                modded: result.modInfo != null && result.modInfo.modList != null && result.modInfo.modList.length > 0,
                srvRecord: result.srvRecord,
                levelName: result.levelName,
                edition: result.edition,
                serverID: result.serverID,
                gameType: result.gameType,
                gameMode: result.gameMode,
                gameModeID: result.gameModeID,
                portIPv4: result.portIPv4,
                portIPv6: result.portIPv6,
                version: {
                    minecraft: result.version + (result.software ? ` (${result.software})` : ""),
                    protocol: result.protocolVersion ?? null
                },
                players: {
                    online: result.onlinePlayers,
                    max: result.maxPlayers,
                    sample: players
                },
                motd: {
                    raw: result.description.text.raw,
                    clean: result.description.text.clean,
                    ansi: result.description.ansi
                },
                favicon: result.favicon,
                plugins: result.plugins ?? null,
                mods: result.modInfo ?? null
            }

            if (final.bedrock) {
                delete final.mods
                delete final.favicon
            }

            if (final.mods) {
                final.mods.modList.forEach(mod => {
                    if (mod.modmarker) {
                        mod.version = mod.modmarker
                        delete mod.modmarker
                    }

                    if (mod.modid) {
                        mod.modId = mod.modid
                        delete mod.modid
                    }
                })

                final.mods.modList = final.mods.modList.filter(mod => !(["minecraft", "fml", "mcp", "forge"].includes(mod.modId.toLowerCase())))
            }

            if (final.plugins) {
                final.plugins.forEach((plugin, index) => {
                    let full = plugin.toString().trim()
                    final.plugins[index] = {
                        name: full.split(" ").shift(),
                        version: full.split(" ").splice(1).join(" ")
                    }
                })
            }
        } else {
            final = {
                ip: ip,
                port: port,
                online: false,
                error: result
            }
        }

        requestCache.set(cacheKey, final)

        return final
    }
}

module.exports = Protocol