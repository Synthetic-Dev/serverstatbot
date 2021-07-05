const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Prefix: {
        type: String,
        default: process.env.ISDEV == "TRUE" ? "--" : "."
    },
    _guildId: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "prefixes", Schema)