const Mongoose = require("mongoose")

const Schema = new Mongoose.Schema({
    _name: {
        type: String,
        default: __filename.split(__dirname + "/").pop().split(".").shift().toLowerCase()
    },
    Value: {
        type: Boolean,
        default: false
    }
})

module.exports = Mongoose.model("globals", Schema)