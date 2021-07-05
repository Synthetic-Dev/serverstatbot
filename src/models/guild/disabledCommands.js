const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Commands: {
        type: Array,
        default: []
    },
    _guildId: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "disabledCommands", Schema)