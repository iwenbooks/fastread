const mongoose = require('mongoose')
const Schema = mongoose.Schema

const MonitorSchema = new Schema({
    "time": {type: Date, default: Date.now},
    "eventid": {type: Number},
    "username": {type: String}
})

MonitorSchema.pre('save', function(next){
    this.time = Date.now()
    next()
})

const Monitor = mongoose.model('Monitor', MonitorSchema)
module.exports = Monitor
