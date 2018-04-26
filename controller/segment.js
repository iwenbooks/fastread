'use strict';

const jwt = require('../middleware/jwt')
const SegmentModel = require('../model/segment');

const list = async (ctx) => {
    let segments = await SegmentModel.find().exec();
    ctx.body = segments;
}

const create = async (ctx) => {
    let content = ctx.request.body.content;

    let segment = new SegmentModel({
		content: content
    })
    
    let newSegment = await segment.save();

    ctx.status = 200;
    ctx.body = {}
}

module.exports.securedRouters = {
};

module.exports.routers = {
    'GET /segment': list,
    'POST /segment': create
};