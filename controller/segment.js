'use strict';

const jwt = require('../middleware/jwt')
const SegmentModel = require('../model/segment');

const list = async (ctx) => {
    let page = Number(ctx.query.page) || 1;
    let limit = 10;
    let skip = (page - 1) * limit;

    let segments = await SegmentModel.find().skip(skip).limit(limit).exec();
    ctx.body = segments;
}

const create = async (ctx) => {
    let segmentModel = ctx.request.body;

    let segment = new SegmentModel(segmentModel)

    let newSegment = await segment.save();

    ctx.status = 200;
    ctx.body = { _id: newSegment._id }
}

const getInfoById = async (ctx) => {
    let segmentInfo = await SegmentModel.findById(ctx.params.id).exec()
    ctx.body = segmentInfo
}

const updateWordsList = async (ctx) => {
    let segmentInfo = await SegmentModel.findById(ctx.request.body.id).exec()
    let pattern = new RegExp(".,;'\"[]"); 
    let words = segmentInfo.content.replace(pattern, '$1§sep§').split('§sep§')
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].replace(pattern, '')
    }
    ctx.body = words
}

module.exports.securedRouters = {
};

module.exports.routers = {
    'GET /segment': list,
    'POST /segment': create,
    'GET /segment/:id': getInfoById,
    'POST /segment/words': updateWordsList
};