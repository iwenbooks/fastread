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

module.exports.securedRouters = {
    'POST /comment/segment': commentSegment
};

module.exports.routers = {
};