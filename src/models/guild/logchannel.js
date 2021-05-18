const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Value: {
        type: String,
        default: "0"
    },
    _guildId: {
        type: String,
        required: [true, "Needs an associated guild"]
    },

    // OLD
    GuildID: {
        type: String
    }
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "logchannels", Schema)