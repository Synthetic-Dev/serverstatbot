const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Ip: {
        type: String,
        default: "0.0.0.0"
    },
    _guildId: {
        type: String,
        required: [true, "Needs an associated guild"]
    },

    // OLD
    Value: {
        type: String
    },
    GuildID: {
        type: String
    }
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "ips", Schema)