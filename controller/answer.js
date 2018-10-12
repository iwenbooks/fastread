'use strict';
const AnswerModel = require('../model/answer');
const QuestionModel = require('../model/askQuestion');
const jwt =require('../middleware/jwt');
const commonFunction =require('../middleware/common_function');
const UserModel = require('../model/user');
const createAnswer = async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId = token.id;
    try {
        let answer = new AnswerModel({
            "user":userId,
            "question":ctx.request.body.question,
            "answer":ctx.request.body.answer,
        });
        let answers = await answer.save();
        await QuestionModel.update({"_id":ctx.request.body.question},﻿{'$push':{"answer":answers._id}}).exec();
        let answerNum = await QuestionModel.find({"_id":ctx.request.body.question}).exec();
        answerNum=answerNum[0]['answerNum']+1;
        await QuestionModel.update({"_id":ctx.request.body.question},{"answerNum":answerNum}).exec();
        ctx.status=200;
        ctx.body={_id:answers._id}
    }catch (e) {
        ctx.status=403;
        ctx.body={err:e}
    }
};
const getAnswerByQuestionId = async(ctx)=>{
    let page = ctx.request.body.page || 1;
    let limit = Number(ctx.request.body.limit) || 10;
    let skip = (page - 1) * limit;
    let question = ctx.request.body.id;
    let answers =await AnswerModel.find({"question":question}).sort({"likeNum":-1}).skip(skip).limit(limit).exec();
    answers=commonFunction.parseJSON(answers);
    for(let i =0;i<answers.length;i++) {
        let userId = answers[i]['user'];
        let user = await UserModel.find({"_id": userId}, {"_id": 1, "nickname": 1, "avatar": 1}).exec();
        user = user[0];
        answers[i]['user']=user;
    }
    ctx.status=200;
    ctx.body=answers;
};
const likeAnawer=async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let answerId = ctx.query.id;
    console.log(answerId);
    let answer = await AnswerModel.find({"_id":answerId});
    console.log(answer);
    answer=answer[0];
    console.log(answer);
    if(userId in answer.likeList){
        ctx.body={error :"have Liked"};
        ctx.status=403;
        return ;
    }else {
        answer.likeNum+=1;
        answer.likeList.push(userId)
    }

    let newAnswer = new AnswerModel(answer);
    await newAnswer.save();
    ctx.status=200;
    ctx.body={};
};
module.exports.securedRouters = {
    'POST /createAnswer':createAnswer,
    'GET /likeAnawer':likeAnawer
};
module.exports.routers = {
    'POST /getAnswerByQuestionId':getAnswerByQuestionId
};
