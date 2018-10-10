'use strict';
const QuestionModel = require('../model/askQuestion');
const jwt =require('../middleware/jwt');
const conmonFunction = require('../middleware/common_function');
const BookModel = require('../model/book');
const UserModel =require('../model/user');
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
    let result ;
    let questions =await QuestionModel.find().sort({"created":-1}).skip(skip).limit(limit).exec();
    questions = conmonFunction.parseJSON(questions);
    for(let i = 0;i<questions.length;i++){
        let tmp ={};
        let bookId = questions[i]['book'];
        let book = await BookModel.find({"_id":bookId},{"_id","bookname":1,"author":1,"cover":1,"segments":1}).exec();
        book =book[0];
        let userId = questions[i]['presenter'];
        let user = await UserModel.findById(userId,{"_id":1,"nickname":1,"avatar":1}).exec();
        user=user[0];
        tmp['user']=user;
        tmp['content']=questions[i]['questionContent'];
        let segmentNumber =0;
        for(;segmentNumber<book.segments.length;segmentNumber++){
            if(book.segments[segmentNumber]==questions[i]['segment'])
                break;
        }
        delete book.segments;
        tmp['book']=book;
        tmp['segment']={
            "name":segmentNumber,
            '_id':questions[i]['segment']
        };
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
    'GET /getAllQuestion':getAllQuestion
};
