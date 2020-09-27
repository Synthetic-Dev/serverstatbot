const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    Value: {
        type: Number
    },
    GuildID: String
})

const MessageModel = module.exports = mongoose.model("ports", Schema)