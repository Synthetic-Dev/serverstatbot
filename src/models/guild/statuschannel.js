const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    ChannelId: {
        type: String,
        default: "0"
    },
    MessageId: {
        type: String,
        default: "0"
    },
    Type: {
        type: Number,
        default: 0
    },
    _guildId: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "statuschannels", Schema)