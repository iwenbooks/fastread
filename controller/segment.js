'use strict';

const jwt = require('../middleware/jwt')
const SegmentModel = require('../model/segment');

const list = async (ctx) => {
    let segments = await SegmentModel.find().exec();
    ctx.body = segments;
}

const create = async (ctx) => {
    let segmentModel = ctx.request.body;

    let segment = new SegmentModel(segmentModel)
    
    let newSegment = await segment.save();

    ctx.status = 200;
    ctx.body = {_id: newSegment._id}
}

const getInfoById = async (ctx) => {
    let segmentInfo = await SegmentModel.findById(ctx.params.id).exec()
    ctx.body = segmentInfo
}

module.exports.securedRouters = {
};

module.exports.routers = {
    'GET /segment': list,
    'POST /segment': create,
    'GET /segment/:id': getInfoById
};