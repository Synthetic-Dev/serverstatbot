const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    ApiKey: {
        type: String,
        default: "0"
    },
    _guildId: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "hypixelKeys", Schema)