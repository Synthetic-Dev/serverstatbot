const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Port: {
        type: Number,
        default: 25565
    },
    QueryPort: {
        type: Number,
        default: -1
    },
    _guildId: {
        type: String,
        required: [true, "Needs an associated guild"]
    },

    // OLD
    Value: {
        type: Number
    },
    GuildID: {
        type: String
    }
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "ports", Schema)