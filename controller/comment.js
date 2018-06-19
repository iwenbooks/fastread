'use strict';

const jwt = require('../middleware/jwt')
const SegmentModel = require('../model/segment')
const CommentModel = require('../model/comment')


const commentSegment = async (ctx) => {
    let segmentInfo = await SegmentModel.findById(ctx.request.body.segment).exec()
    let token = jwt.getToken(ctx)
    let userId = token.id

    let comment = new CommentModel({
        'user': userId,
        'content': ctx.request.body.content
    })
    let newComment = await comment.save()

    segmentInfo.comments.push(newComment._id)
    let updatedSegment = await segmentInfo.save()

    ctx.status = 200;
    ctx.body = {};
}

const getSegmentCommentsById = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = Number(ctx.query.limit) || 10;
    let skip = (page - 1) * limit;

    let segmentInfo = await SegmentModel
        .findById(ctx.params.id)
        .select('comments')
        .populate({
            path: 'comments',
            options: {
                sort: { 'created': -1 },
                skip: skip,
                limit: limit
            }
        })
        .exec()
    ctx.body = segmentInfo
}

module.exports.securedRouters = {
    'POST /comment/segment': commentSegment
};

module.exports.routers = {
    'GET /comment/segment/:id': getSegmentCommentsById
};