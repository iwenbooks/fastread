'use strict'

const MonitorModel = require('../model/monitor')

const record = async (ctx) => {
    let log = ctx.request.body
    let time = log.time
    let eventid = log.eventid
    let username = log.username
    try{
        let rec = await new MonitorModel({time:time, eventid:eventid, username:username}).save()
        ctx.status = 200
        ctx.body = {}
    }
    catch(error){
        ctx.status = 403
        ctx.body = {error:'error'}
    }
}

module.exports.securedRouters = {}
module.exports.routers = {
    'POST /monitor': record
}
