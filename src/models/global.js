const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    Maintenance: {
        type: Boolean,
        default: false
    },
    ServerCountLog: {
        type: Array,
        default: []
    }
})

module.exports = Mongoose.model((process.env.ISDEV == "TRUE" ? "T_" : "") + "globals", Schema)