const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    Value: {
        type: Number
    },
    GuildID: String
})

module.exports = {
    model: mongoose.model("ports", Schema),
    defaultValue: 25565
}