const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Value: {
        type: String,
        default: "."
    },
    GuildID: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = Mongoose.model("prefixes", Schema)