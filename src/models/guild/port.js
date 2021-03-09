const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Value: {
        type: Number,
        default: 25565
    },
    GuildID: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = Mongoose.model("ports", Schema)