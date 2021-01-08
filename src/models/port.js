const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    Value: {
        type: Number,
        default: 25565
    },
    GuildID: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = mongoose.model("ports", Schema)