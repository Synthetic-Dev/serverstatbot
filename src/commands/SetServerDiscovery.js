const Util = require("../utils/util.js")
const CommandBase = require("../classes/CommandBase.js")

const validDiscordInvite = /(https?:\/\/)?(www\.)?(discord\.(gg|com)|discordapp\.com\/invite)\/.+[a-zA-Z0-9]/g

class Command extends CommandBase {
    constructor(client) {
        super(client, {
            name: "setserverdiscovery",
            descId: "COMMAND_SETSERVERDISCOVERY",
            aliases: [
                "setsrvdisc",
                "srvdisc"
            ],
            args: [{
                name: "setting",
                descId: "COMMAND_SETSERVERDISCOVERY_ARG1"
            },
            {   
                name: "value",
                descId: "COMMAND_SETSERVERDISCOVERY_ARG2",
            }],
            optionTree: {
                display: {
                    on: {
                        _value: true,
                        _aliases: ["true"]
                    },
                    off: {
                        _value: true,
                        _aliases: ["false"]
                    }
                },
                invite: {
                    remove: true,
                    code: false
                }
            },
            perms: [
                "ADMINISTRATOR"
            ]
        })

        this.setOptionFunc("display.on", options => {
            options.settings.set("server", true, "Discovery")
            Util.replyMessage(options.message, options.lang.COMMAND_SETSERVERDISCOVERY_CONTENT.format(options.lang.ENABLED.toLowerCase())).catch(e => {
                console.error(`SetServerDiscovery[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
            })
        })
        this.setOptionFunc("display.off", options => {
            options.settings.set("server", false, "Discovery")
            Util.replyMessage(options.message, options.lang.COMMAND_SETSERVERDISCOVERY_CONTENT.format(options.lang.DISABLED.toLowerCase())).catch(e => {
                console.error(`SetServerDiscovery[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
            })
        })
        this.setOptionFunc("invite", (options, input) => {
            if (validDiscordInvite.test(input)) {
                let code = input.match(/\/([a-zA-Z0-9]*$)/g)
                if (!code || !code[0]) return Util.replyError(options.message, options.lang.COMMAND_SETSERVERDISCOVERY_INVITE_NOCODE)
                code = code[0].replace(/\//g, "")
                
                options.settings.set("server", code, "DiscoveryInvite")
                Util.replyMessage(options.message, options.lang.COMMAND_SETSERVERDISCOVERY_INVITE_ADD.format(code)).catch(e => {
                    console.error(`SetServerDiscovery[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
                })
            } else {
                Util.replyError(options.message, options.lang.COMMAND_SETSERVERDISCOVERY_INVITE_INVALID.format(input))
            }
        })
        this.setOptionFunc("invite.remove", options => {
            options.settings.set("server", "", "DiscoveryInvite")
            Util.replyMessage(options.message, options.lang.COMMAND_SETSERVERDISCOVERY_INVITE_REMOVE).catch(e => {
                console.error(`SetServerDiscovery[replyMessage]: ${e.toString()};\n${e.message}${e.method ? `::${e.method}` : ""} at ${e.path ? `${e.path} ` : ""}${e.lineNumber ? `line ${e.lineNumber}` : ""}`)
            })
        })
    }

    async execute(options) {
        return this.executeOptionTree(options)
    }
}

module.exports = Command