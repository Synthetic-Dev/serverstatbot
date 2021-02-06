const Minecraft = require("minecraft-protocol")
const Versions = require("minecraft-protocol/src/version.js")
const DNS = require("minecraft-protocol/src/client/tcp_dns.js")
const Forge = require("minecraft-protocol-forge")
const MinecraftData = require("minecraft-data")

class protocol {
    constructor() {
        console.error(`The ${this.constructor.name} class cannot be constructed.`);
    }

    /**
     * Get primary supported minecraft versions
     * @returns {Array}
     */
    static getPrimarySupportedVersions() {
        return ["1.7.10", "1.8.8", "1.9", "1.10", "1.11", "1.12", "1.13", "1.14", "1.15", "1.16"]
    }

    /**
     * Get supported minecraft versions
     * @returns {Array}
     */
    static getSupportedVersions() {
        return ["1.7.10", "1.8.8", "1.9 15w40b", "1.9", "1.9.1-pre2", "1.9.2", "1.9.4", "1.10 16w20a", "1.10-pre1", "1.10", "1.10.1", "1.10.2", "1.11 16w35a", "1.11", "1.11.2", "1.12 17w15a", "1.12 17w18b", "1.12-pre4", "1.12", "1.12.1", "1.12.2", "1.13 17w50a", "1.13", "1.13.1", "1.13.2-pre1", "1.13.2-pre2", "1.13.2", "1.14", "1.14.1", "1.14.3", "1.14.4" , "1.15", "1.15.1", "1.15.2", "1.16 20w13b", "1.16 20w14a", "1.16-rc1", "1.16", "1.16.1", "1.16.2", "1.16.3", "1.16.4", "1.16.5"]
    }

    /**
     * Ping a minecraft server to get its details
     * @param {string} ip 
     * @param {number} port 
     * @returns {Promise<Object>}
     */
    static ping(ip, port) {
        return new Promise((resolve, reject) => {
            const pingData = {
                host: ip ? ip : "localhost",
                port: port ? port : 25565,
            }

            const mcData = MinecraftData(Versions.defaultVersion)
            const version = mcData.version

            pingData.majorVersion = version.majorVersion
            pingData.protocolVersion = version.version
            pingData.closeTimeout = 10 * 1000
            pingData.responseTimeout = 2 * 1000

            const client = new Minecraft.Client(false, version.minecraftVersion)

            let closeTimer

            client.on("error", error => {
                clearTimeout(closeTimer)
                reject(error)
            })

            client.once("server_info", packet => {
                const data = JSON.parse(packet.response)
                const start = Date.now()

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

module.exports = protocol