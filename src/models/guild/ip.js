const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Value: {
        type: String,
        default: "0.0.0.0"
    },
    GuildID: {
        type: String,
        required: [true, "Needs an associated guild"]
    }
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "ips", Schema)