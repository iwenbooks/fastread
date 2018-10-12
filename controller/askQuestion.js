'use strict';
const QuestionModel = require('../model/askQuestion');
const jwt =require('../middleware/jwt');
const conmonFunction = require('../middleware/common_function');
const BookModel = require('../model/book');
const UserModel =require('../model/user');
const SegmentModel =require('../model/segment');
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
const getQuestionByQuestionId = async(ctx)=>{
    let questionId = ctx.query.id;
    let questions = await QuestionModel.find({"_id":questionId});
    questions=conmonFunction.parseJSON(questions);
    questions = questions[0];
    let userId = questions['presenter'];
    let user = await UserModel.find({"_id":userId},{"_id":1,"nickname":1,"avatar":1});
    user=user[0];
    questions['user']=user;
    delete questions.book;
    delete questions.segment;
    delete questions.presenter;
    delete questions.answer;
    ctx.body =questions;
    ctx.status=200;
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
    questions=conmonFunction.parseJSON(questions);
    for(let i=0;i<questions.length;i++){
        for(let j=0;j<questions[i].answer.length;j++){
            let userId=questions[i].answer[j].user;
            let user = await UserModel.find({"_id":userId},{"_id":1,"nickname":1,"avatar":1}).exec();
            user=user[0];
            questions[i].answer[j].user=user;
        }
        let userId = questions[i]['presenter'];
        let user = await UserModel.find({"_id":userId},{"_id":1,"nickname":1,"avatar":1}).exec();
        user=user[0];
        questions[i]['user']=user;
        delete questions[i].book;
        delete questions[i].segment;
        delete questions[i].presenter;
    }
    ctx.body =questions;
    ctx.status=200;
};
const getAllQuestion =async(ctx)=>{
    let page = ctx.query.page || 1;
    let limit = Number(ctx.query.limit) || 10;
    let skip = (page - 1) * limit;
    let result =[];
    let questions =await QuestionModel.find().sort({"created":-1}).skip(skip).limit(limit).exec();
    questions = conmonFunction.parseJSON(questions);
    for(let i = 0;i<questions.length;i++){
        let tmp ={};

        let segmemtId= questions[i]['segment'];
        let segment = await SegmentModel.find({"_id":segmemtId},{"_id":1,"name":1}).exec();
        segment=segment[0];
        tmp['segment']=segment;

        let bookId = questions[i]['book'];
        let book = await BookModel.find({"_id":bookId},{"_id":1,"bookname":1,"author":1,"cover":1}).exec();
        book =book[0];
        tmp['book']=book;

        let userId = questions[i]['presenter'];
        let user = await UserModel.find({"_id":userId},{"_id":1,"nickname":1,"avatar":1}).exec();
        user=user[0];
        tmp['user']=user;
        tmp['content']=questions[i]['questionContent'];
        tmp['_id']=questions[i]['_id'];
        result.push(tmp);
    }
    ctx.status=200;
    ctx.body = result;
};



module.exports.securedRouters = {
    'POST /createQuestion':createQuestion
};

module.exports.routers = {
    'POST /getQuestionBySegmentId':getQuestionBySegmentId,
    'GET /getQuestionByQuestionId':getQuestionByQuestionId,
    'GET /getAllQuestion':getAllQuestion
};
