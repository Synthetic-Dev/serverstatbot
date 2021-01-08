const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    Value: {
        type: String,
        default: "0.0.0.0"
    },
    GuildID: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = mongoose.model("ips", Schema)