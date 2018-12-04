'use strict';
const QuestionModel = require('../model/askQuestion');
const jwt =require('../middleware/jwt');
const conmonFunction = require('../middleware/common_function');
const BookModel = require('../model/book');
const UserModel =require('../model/user');
const SegmentModel =require('../model/segment');
const AnswerModel = require('../model/answer');
const qs = require('querystring');
const http = require('http');

const judge = function (comment) {
    let promise = new Promise((resolve, reject) => {
      try {
        var data = { comment: comment }
        var content = qs.stringify(data)
        var options = {
            hostname: '127.0.0.1',

            port: 8667,

            path: '/?' + content,

            method: 'GET'

        };
        var req = http.request(options, function (res) {
            //console.log('STATUS: ' + res.statusCode);

            //console.log('HEADERS: ' + JSON.stringify(res.headers));

            res.setEncoding('utf8');
            let data = "";
            res.on('data', function (chunk) {
                resolve(chunk);
            });

        })
      }catch(e){
        console.log(e);
      }
      req.end();
    })

    return promise;
};
const createQuestion = async (ctx) => {
    let token = jwt.getToken(ctx);
    let userId = token.id;
    try {
        console.log('0');
        let content = ctx.request.body.content;
        console.log('1');
        let ans = await judge(content);
        let isQuestion = false;
        if (JSON.parse(ans)['flag']) {
            isQuestion = true;
        }
        let question = new QuestionModel({
            "presenter": userId,
            "book": ctx.request.body.book,
            "segment": ctx.request.body.segment,
            "questionContent": ctx.request.body.content,
            "index": ctx.request.body.index,  // 传进来一个index，如果是整段则为-1
            "isQuestion": isQuestion,
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
    let questions = await QuestionModel.find({"_id":questionId}).populate(
        {
            path:"book",
            select:{
                "_id":1,
                "bookname":1,
                "author":1,
                "cover":1,
                "isQuestion":1
            }
        }
    );
    questions=conmonFunction.parseJSON(questions);
    questions = questions[0];
    let userId = questions['presenter'];
    let user = await UserModel.find({"_id":userId},{"_id":1,"nickname":1,"avatar":1});
    user=user[0];
    questions['user']=user;
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
            "index":1,
            "answer":1,
            "likeNum":1
        },
        options:{
            limit:5
        }
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
const getSentenceQuestion = async(ctx) => {
    let page = ctx.request.body.page || 1;
    let limit = Number(ctx.request.body.limit) || 10;
    let skip = (page - 1) * limit;
    let segmentId = ctx.request.body.segment;
    let sentenceIndex = ctx.request.body.sentenceIndex;
    let questions = await QuestionModel.find({"segment":segmentId, "index":sentenceIndex}).populate({
        path: 'answer',
        select: {
            "user":1,
            "index":1,
            "answer":1,
            "likeNum":1
        },
        options:{
            limit:5
        }
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
    let questions =await QuestionModel.find().sort({"created":1}).skip(skip).limit(limit).exec();
    questions = conmonFunction.parseJSON(questions);
    for(let i = 0;i<questions.length;i++){
        let tmp ={};
        let segmemtId= questions[i]['segment'];
        let segment = await SegmentModel.find({"_id":segmemtId},{"_id":1,"name":1}).exec();
        segment=segment[0];
        tmp['segment']=segment;

        let answer =  questions[i]['answer'];
        answer = answer[answer.length-1];
        answer = await AnswerModel.find({"_id":answer},{"_id":1,"answer":1}).exec();
        tmp['answer']=answer[0];

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
        tmp['created']=questions[i]['created'];
        tmp['answerNum']=questions[i]['answerNum'];
        result.push(tmp);
    }
    ctx.status=200;
    ctx.body = result;
};

const deleteQuestionById = async(ctx)=>{
    let id = ctx.request.body.question;
    let question = await QuestionModel.findById(id);
    let answers = question["answer"];
    for (let i=0; i<answers.length; i++) {
        let answerId = answers[i];
        await AnswerModel.findByIdAndRemove(answerId);
    }
    await QuestionModel.findByIdAndRemove(id);
    ctx.status=200;
}


module.exports.securedRouters = {
    'POST /createQuestion':createQuestion
};

module.exports.routers = {
    'POST /getQuestionBySegmentId':getQuestionBySegmentId,
    'POST /getSentenceQuestion':getSentenceQuestion,
    'GET /getQuestionByQuestionId':getQuestionByQuestionId,
    'GET /getAllQuestion':getAllQuestion,
    'DEL /deleteQuestion': deleteQuestionById
};
