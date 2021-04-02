/*const Minecraft = require("minecraft-protocol")
const DNS = require("minecraft-protocol/src/client/tcp_dns.js")
const Forge = require("minecraft-protocol-forge")
const MinecraftData = require("minecraft-data")*/
const MinecraftUtil = require("minecraft-server-util")

const formattingCode = /\u00C2?\u00A7([a-fklmnor0-9])/g;

class Protocol {
    constructor() {
        console.error(`The ${this.constructor.name} class cannot be constructed.`);
    }

    static requestCache = {};
    static cacheTime = 30*1000;

    /**
     * The minimum minecraft version that the statusFE01() handshake supports
     * @returns {string}
     */
     static getMinSupportedVersion() {
        return "1.4.2"
    }

    /**
     * Send requests to server to get all available information
     * @private Use getInfo() for formatted data
     * @param {string} ip 
     * @param {number} port 
     * @param {boolean} verify
     * @returns {Promise<boolean, Object<string, any> | Error | string>}
     */
    static async sendRequest(ip, port = 25565, verify = true) {
        Object.keys(this.requestCache).forEach((address) => {
            let data = this.requestCache[address]
            if (data && data.expires < Date.now()) {
                delete this.requestCache[address];
            }
        })

        let cachedData = this.requestCache[ip + ":" + port]
        if (cachedData) {
            cachedData.value.cached = true;
            return [true, cachedData.value]
        }

        let bulkData = new Promise((resolve, reject) => {
            let args = [ip, {port: port, timeout: 3000}]

            function query(statusResponse) {
                if (statusResponse) statusResponse.bedrock = statusResponse.bedrock ? true : false;

                args[1].sessionID = 1
                args[1].timeout = 5000
                MinecraftUtil.queryFull(...args).then(queryResponse => {
                    queryResponse.query = true;
                    queryResponse.ping = statusResponse != null;

                    if (statusResponse) {
                        queryResponse.bedrock = statusResponse.bedrock;
                        queryResponse.modInfo = queryResponse.modInfo ? queryResponse.modInfo : statusResponse.modInfo ? statusResponse.modInfo : null
                        queryResponse.favicon = queryResponse.favicon ? queryResponse.favicon : statusResponse.favicon ? statusResponse.favicon : null

                        if (queryResponse.bedrock) {
                            queryResponse.edition = statusResponse.edition;
                            queryResponse.serverGUID = statusResponse.serverGUID;
                            queryResponse.serverID = statusResponse.serverID;
                            queryResponse.motdLine1 = statusResponse.motdLine1;
                            queryResponse.motdLine2 = statusResponse.motdLine2;
                            queryResponse.gameMode = statusResponse.gameMode;
                            queryResponse.gameModeID = statusResponse.gameModeID;
                            queryResponse.portIPv4 = statusResponse.portIPv4;
                            queryResponse.portIPv6 = statusResponse.portIPv6;
                        }
                    } else {
                        queryResponse.bedrock = queryResponse.levelName != null
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
        result.latency = -1;
        result._description = {
            raw: [],
            text: {
                raw: "A Minecraft Server",
                clean: "A Minecraft Server"
            },
            ansi: null,
            default: true
        }

        if (result.bedrock) {
            result._description.raw = result.motdLine1 || result.motdLine2 ? [result.motdLine1, result.motdLine2] : (result.description ? [result.description] : [])
        } else {
            result._description.raw = result.description ? [result.description] : []
        }

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
            desc.text.raw = desc.text.raw.join("\n").trim()
            desc.text.clean = desc.text.clean.join("\n").trim()

            if (desc.text.raw != "") {
                desc.default = false
            } else {
                desc.text.raw = "A Minecraft Server"
                desc.text.clean = "A Minecraft Server"
            }
        }

        if (result.bedrock || !verify) {
            this.requestCache[ip + ":" + port] = {
                expires: Date.now() + this.cacheTime,
                value: result
            }
            return [true, result]
        }
        /*
        let verifyData = new Promise((resolve, reject) => {
            const dataVersion = result.version.match(/(\d+\.)?(\d+\.)?(\d)/g).filter(match => match.length > 0)[0] || "1.16.5"
            const mcData = MinecraftData(dataVersion)
            const version = mcData.version

            const pingData = {
                host: ip,
                port: port,
                majorVersion: version.majorVersion,
                protocolVersion: version.version,
                closeTimeout: 5000,
                responseTimeout: 2000
            }

            const client = new Minecraft.Client(false, version.minecraftVersion)

            let closeTimer  
            client.on("error", () => {clearTimeout(closeTimer); resolve([false])})
            client.on("state", newState => {if (newState === Minecraft.states.STATUS) client.write("ping_start", {})})
            client.on("connect", () => {
                client.write("set_protocol", {
                    protocolVersion: pingData.protocolVersion,
                    serverHost: pingData.host,
                    serverPort: pingData.port,
                    nextState: 1
                })
                if (!result.modInfo) Forge.autoVersionForge(client);
                client.state = Minecraft.states.STATUS
            })

            client.once("server_info", packet => {
                const data = JSON.parse(packet.response)
                const start = Date.now()

                data.request = pingData

                const maxTime = setTimeout(() => {
                    clearTimeout(closeTimer)
                    resolve([true, data])
                    client.end()
                }, pingData.responseTimeout)

                client.once("ping", () => {
                    data.latency = Date.now() - start

                    clearTimeout(maxTime)
                    clearTimeout(closeTimer)
                    resolve([true, data])
                    client.end()
                })

                client.write("ping", {
                    time: [0, 0]
                })
            })

            closeTimer = setTimeout(() => {
                client.end()
                resolve([false])
            }, pingData.closeTimeout)

            DNS(client, pingData)
            pingData.connect(client)
        })

        let [vSuccess, vResult] = await verifyData
        if (vSuccess) {
            result.latency = vResult.latency
            result.protocolVersion = result.protocolVersion ? result.protocolVersion : vResult.request.protocolVersion

            if (!result.favicon) result.favicon = vResult.favicon;

            if (vResult.description) {
                let desc = result.description
                if (typeof vResult.description == "string" && desc.default) {
                    desc.text.raw = vResult.description
                    desc.text.clean = vResult.description.replace(formattingCode, '').trim()
                } else if (typeof vResult.description != "string") {
                    if (desc.default) {
                        let newText = vResult.description.text
                        if (vResult.description.extra) {
                            vResult.description.extra.forEach(extra => {
                                newText += extra.text
                            })
                        }
                        desc.text.raw = newText
                        desc.text.clean = newText.replace(formattingCode, '').trim()
                    }
                    desc.ansi = vResult.description.extra
                }

                if (desc.text.raw != "") {
                    desc.default = false
                } else {
                    desc.text.raw = "A Minecraft Server"
                    desc.text.clean = "A Minecraft Server"
                }
            }

            if (!result.modInfo) {
                if (vResult.modinfo || vResult.modInfo) result.modInfo = vResult.modinfo ? vResult.modinfo : vResult.modInfo;
                else if (vResult.forgeData) {
                    result.modInfo = {
                        type: "FML",
                        modList: vResult.forgeData.mods
                    }
                }
            }
        }
        */

        this.requestCache[ip + ":" + port] = {
            expires: Date.now() + this.cacheTime,
            value: result
        }

        return [true, result]
    }

    /**
     * Ping a minecraft server to get its details
     * @param {string} ip 
     * @param {number} port 
     * @param {boolean} verify
     * @returns {Promise<{ip: string, port: number, online: boolean, error?: Error | string, latency?: number, ping?: boolean, query?: boolean, cached?: boolean, bedrock?: boolean, modded?: boolean, srvRecord?: {host: string, port: number}, version?: {minecraft: string, gamemode?: string, protocol?: number}, players?: {online: number, max: number, sample: {id: string?, name: {raw: string, clean: string}}[], all: boolean}, motd?: {raw: string, clean: string, ansi: Object[]?}, favicon?: string, plugins?: {name: string, version: string}[], modInfo?: {type: string, modlist: Object[]}}>}
     */
    static async getInfo(ip, port = 25565, verify = true) {
        let [success, result] = await this.sendRequest(ip, port, verify)

        if (success) {
            let final = {
                ip: result.host,
                port: result.port,
                latency: result.latency,
                online: true,
                ping: result.ping,
                query: result.query,
                cached: result.cached,
                bedrock: result.bedrock,
                modded: result.modInfo != null && result.modInfo.modList != null && result.modInfo.modList.length > 0,
                srvRecord: result.srvRecord,
                bedrockInfo: result.bedrock ? {
                    levelName: result.levelName,
                    edition: result.edition,
                    serverID: result.serverID,
                    gameMode: result.gameMode,
                    gameModeID: result.gameModeID,
                    portIPv4: result.portIPv4,
                    portIPv6: result.portIPv6
                } : null,
                version: {
                    minecraft: result.version + (result.software ? ` (${result.software})` : ""),
                    gamemode: result.gameType ? result.gameType : null,
                    protocol: result.protocolVersion ? result.protocolVersion : null
                },
                players: {
                    online: result.onlinePlayers,
                    max: result.maxPlayers,
                    sample: result.players ? result.players : result.samplePlayers ? result.samplePlayers : []
                },
                motd: {
                    raw: result.description.text.raw,
                    clean: result.description.text.clean,
                    ansi: result.description.ansi
                },
                favicon: result.favicon,
                plugins: result.plugins ? result.plugins : null,
                mods: result.modInfo ? result.modInfo : null
            }

            if (final.bedrock) {
                delete final.mods
                delete final.favicon
            }

            if (!final.cached) {
                if (final.players.sample) {
                    final.players.sample.forEach((player, index) => {
                        if (typeof player == "string") {
                            final.players.sample[index] = {
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
            }

            return final
        } else {
            return {
                ip: ip,
                port: port,
                online: false,
                error: result
            }
        }
    }

    /**
     * Get primary supported minecraft versions
     * @deprecated Use getMinSupportedVersion() instead
     * @returns {string}
     */
    static getDefaultVersion() {
        return "1.16.5"
    }

    /**
     * Get primary supported minecraft versions
     * @deprecated Use getMinSupportedVersion() instead
     * @returns {Array}
     */
    static getPrimarySupportedVersions() {
        return ["1.7.10", "1.8.8", "1.9", "1.10", "1.11", "1.12", "1.13", "1.14", "1.15", "1.16"]
    }

    /**
     * Get supported minecraft versions
     * @deprecated Use getMinSupportedVersion() instead
     * @returns {Array}
     */
    static getSupportedVersions() {
        return ["1.7.10", "1.8.8", "1.9 15w40b", "1.9", "1.9.1-pre2", "1.9.2", "1.9.4", "1.10 16w20a", "1.10-pre1", "1.10", "1.10.1", "1.10.2", "1.11 16w35a", "1.11", "1.11.2", "1.12 17w15a", "1.12 17w18b", "1.12-pre4", "1.12", "1.12.1", "1.12.2", "1.13 17w50a", "1.13", "1.13.1", "1.13.2-pre1", "1.13.2-pre2", "1.13.2", "1.14", "1.14.1", "1.14.3", "1.14.4" , "1.15", "1.15.1", "1.15.2", "1.16 20w13b", "1.16 20w14a", "1.16-rc1", "1.16", "1.16.1", "1.16.2", "1.16.3", "1.16.4", "1.16.5"]
    }
    
    /**
     * Ping a minecraft server to get its details
     * @deprecated Use getInfo() instead
     * @param {string} ip 
     * @param {number} port 
     * @returns {Promise<Object>}
     */
    static ping(ip, port, gameVersion = this.getDefaultVersion()) {
        return new Promise((resolve, reject) => {
            const pingData = {
                host: ip ? ip : "localhost",
                port: port ? port : 25565,
            }

            const mcData = MinecraftData(gameVersion)
            if (!mcData) {
                let error = new Error("Invalid game version")
                error.code = "EVERSREFUSED"
                reject(error)
            }
            const version = mcData.version

            pingData.majorVersion = version.majorVersion
            pingData.protocolVersion = version.version
            pingData.closeTimeout = 10 * 1000
            pingData.responseTimeout = 5 * 1000

            const client = new Minecraft.Client(false, version.minecraftVersion)

            let closeTimer

            client.on("error", error => {
                clearTimeout(closeTimer)
                reject(error)
            })

            client.once("server_info", packet => {
                const data = JSON.parse(packet.response)
                const start = Date.now()

                data.request = pingData

                const maxTime = setTimeout(() => {
                    clearTimeout(closeTimer)

                    resolve(data)

                    client.end()
                }, pingData.responseTimeout)

                client.once("ping", packet => {
                    data.latency = Date.now() - start

                    clearTimeout(maxTime)
                    clearTimeout(closeTimer)

                    resolve(data)

                    client.end()
                })

                let desc = data.description ? (data.description.text ? data.description.text : data.description) : "A Minecraft Server"
                if (typeof desc != "string") desc = "A Minecraft Server";

                data.motd = {
                    raw: desc,
                    clean: desc.replace(/§./g, "").trim()
                }

                delete data.description

                if (data.modinfo && !data.forgeData) {
                    if (data.modinfo.modList.length > 0) {
                        data.forgeData = {
                            mods: data.modinfo.modList
                        }
                    }

                    delete data.modinfo
                }

                if (data.forgeData) {
                    data.forgeData.mods.forEach(mod => {
                        if (mod.modmarker) {
                            mod.version = mod.modmarker
                            delete mod.modmarker

                            mod.version = mod.version.substring(0, 20)
                        }

                        if (mod.modid) {
                            mod.modId = mod.modid
                            delete mod.modid
                        }
                    })

                    data.forgeData.mods = data.forgeData.mods.filter(mod => mod.modId.toLowerCase() != "minecraft")
                }

                if (data.players && data.players.sample) {
                    data.players.sample.forEach(player => {
                        player.name = player.name.replace(/§./g, "").trim()
                    })
                }

                client.write("ping", {
                    time: [0, 0]
                })
            })

            client.on("state", newState => {
                if (newState === Minecraft.states.STATUS) client.write("ping_start", {});
            })

            client.on("connect", () => {
                client.write("set_protocol", {
                    protocolVersion: pingData.protocolVersion,
                    serverHost: pingData.host,
                    serverPort: pingData.port,
                    nextState: 1
                })

                Forge.autoVersionForge(client)

                client.state = Minecraft.states.STATUS
            })

            closeTimer = setTimeout(() => {
                client.end()
                let error = new Error("Timed out")
                error.code = "ETIMEDOUT"
                
                reject(error)
            }, pingData.closeTimeout)

            DNS(client, pingData)
            pingData.connect(client)
        })
    }
}

module.exports = Protocol