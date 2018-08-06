'use strict';

const jwt = require('../middleware/jwt')
const SegmentModel = require('../model/segment')
const BookModel = require('../model/book')
const CommentModel = require('../model/comment')


const commentSegment = async (ctx) => {
    let segmentInfo = await SegmentModel.findById(ctx.request.body.segment).exec()
    let newlength = segmentInfo.comments.length;
    await SegmentModel.update({"_id":ctx.request.body.segment},{$set:{"commentNum":newlength}})
    let token = jwt.getToken(ctx)
    let userId = token.id
    let comment = new CommentModel({
        'user': userId,
        'content': ctx.request.body.content,
        'star':ctx.query.star,
        'book': ctx.request.body.book,
        'segment': ctx.request.body.segment
    })
    let newComment = await comment.save()

    segmentInfo.comments.push(newComment._id)
    let updatedSegment = await segmentInfo.save()

    ctx.status = 200;
    ctx.body = {};
}

const commentBook = async (ctx) => {
    let bookInfo = await BookModel.findById(ctx.request.body.book).exec()
    let token = jwt.getToken(ctx)
    let userId = token.id
    let comment = new CommentModel({
        'user': userId,
        'content': ctx.request.body.content,
        'book': ctx.request.body.book
    })
    let newComment = await comment.save()

    bookInfo.comments.push(newComment._id)
    bookInfo.CommentNum+=1;
    let updatedBook = await bookInfo.save()
    ctx.status = 200;
    ctx.body = {};
}

const getCommentsBySegmentId = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = Number(ctx.query.limit) || 10;
    let skip = (page - 1) * limit;

    let segmentInfo = await SegmentModel
        .findById(ctx.params.segment)
        .select('comments')
        .populate({
            path: 'comments',
            options: {
                sort: { 'created': -1 },
                skip: skip,
                limit: limit
            },
            populate: {
                path: 'user',
                select: '_id nickname avatar'
            }
        })
        .exec()
    ctx.body = segmentInfo
}

const getCommentsByBookId = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = Number(ctx.query.limit) || 10;
    let skip = (page - 1) * limit;

    let bookInfo = await BookModel
        .findById(ctx.params.book)
        .select('comments')
        .populate({
            path: 'comments',
            options: {
                sort: { 'created': -1 },
                skip: skip,
                limit: limit
            },
            populate: {
                path: 'user',
                select: '_id nickname avatar'
            }
        })
        .exec()
    ctx.body = bookInfo
}

const like = async (ctx) => {
    let comment = await CommentModel.findById(ctx.request.body.id).exec()
    let token = jwt.getToken(ctx)
    let userId = token.id
    let alreadyLiked = false

    for (let i = 0; i < comment.likes.length; i++) {
        if (String(comment.likes[i]) === userId) {
            alreadyLiked = true
            comment.likes.splice(i, 1)
            console.log(comment.likes)
            break
        }
    }
    if (!alreadyLiked) {
        comment.likes.push(userId)
    }
    comment.likeNum = comment.likes.length

    let updatedComment = await comment.save()

    ctx.status = 200
    ctx.body = {}
}
const deleteCommentById = async(ctx)=>{
    let id = ctx.params.myid;
    await CommentModel.findByIdAndRemove(id);
    ctx.status=200;
}

module.exports.securedRouters = {
    'POST /comment/segment': commentSegment,
    'POST /comment/book': commentBook,
    'POST /comment/like': like
};

module.exports.routers = {
    'GET /comment/segment/:segment': getCommentsBySegmentId,
    'POST /deleteCommentById/:myid':deleteCommentById,
    'GET /comment/book/:book': getCommentsByBookId
};
