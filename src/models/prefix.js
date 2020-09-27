const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    Value: {
        type: String
    },
    GuildID: String
})

module.exports = {
    model: mongoose.model("prefixes", Schema),
    defaultValue: "."
}