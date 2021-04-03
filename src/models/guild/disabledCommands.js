const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Value: {
        type: Array,
        default: []
    },
    GuildID: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "disabledCommands", Schema)