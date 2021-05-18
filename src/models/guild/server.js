const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Ip: {
        type: String,
        default: "0.0.0.0"
    },
    Port: {
        type: Number,
        default: 25565
    },
    QueryPort: {
        type: Number,
        default: -1
    },
    Discovery: {
        type: Boolean,
        default: false
    },
    DiscoveryInvite: {
        type: String,
        default: ""
    },
    _serverId: {
        type: Number,
        default: 0
    },
    _guildId: {
        type: String,
        required: [true, "Needs an associated guild"]
    },
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "servers", Schema)