'use strict';
const QuestionModel = require('../model/askQuestion');
const jwt =require('../middleware/jwt');


const createQuestion = async (ctx) => {
    let token = jwt.getToken(ctx);
    let userId = token.id;
    try {
        let question = new QuestionModel({
            "presenter": userId,
            "book": ctx.request.body.book,
            "segment": ctx.request.body.segment,
            "questionContent": ctx.request.body.content,
        });
        let questions = await question.save();
        ctx.status = 200;
        ctx.body = {_id: questions._id};
    }catch (e) {
        ctx.status=403;
        ctx.body={err:e}
    }
};
const getQuestionBySegmentId = async(ctx)=>{
    let page = ctx.request.body.page || 1;
    let limit = Number(ctx.request.body.limit) || 10;
    let skip = (page - 1) * limit;
    let segmentId = ctx.request.body.id;
    let questions = await QuestionModel.find({"segment":segmentId}).populate({
        path: 'answer',
        select: {
            "user":1,
            "answer":1,
            "likeNum":1
        },
        limit
    }).sort({"created":-1}).skip(skip).limit(limit).exec();
    ctx.body =questions;
    ctx.status=200;
};
const getAllQuestion =async(ctx)=>{
    let page = ctx.query.page || 1;
    let limit = Number(ctx.query.limit) || 10;
    let skip = (page - 1) * limit;
    let questions =await QuestionModel.find().populate({
        path: 'answer',
        select: {
            "user":1,
            "answer":1,
            "likeNum":1
        }
    }).sort({"answerNum":-1}).skip(skip).limit(limit).exec();
    ctx.status=200;
    ctx.body = questions;
};



module.exports.securedRouters = {
    'POST /createQuestion':createQuestion
};

module.exports.routers = {
    'POST /getQuestionBySegmentId':getQuestionBySegmentId,
    'GET /getAllQuestion':getAllQuestion
};
