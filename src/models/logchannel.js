const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    Value: {
        type: String,
        default: "-1"
    },
    GuildID: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = mongoose.model("logchannels", Schema)