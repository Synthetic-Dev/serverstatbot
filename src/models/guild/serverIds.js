const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Servers: {
        type: Array,
        default: [0]
    },
    _guildId: {
        type: String,
        required: [true, "Needs an associated guild"]
    },
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "servercounts", Schema)