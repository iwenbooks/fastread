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
            "fromanswerID": ctx.request.body.fromanswerID,  // maybe this is the reply to an answer
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
    let answers =await AnswerModel.find({"question":question}).sort({"likeNum":-1,'created':-1}).skip(skip).limit(limit).exec();

    answers=commonFunction.parseJSON(answers);
    for(let i =0;i<answers.length;i++) {
        let userId = answers[i]['user'];
        let user = await UserModel.find({"_id": userId}, {"_id": 1, "nickname": 1, "avatar": 1}).exec();
        user = user[0];
        answers[i]['user']=user;
        let replyId = answers[i]['fromanswerID'];
        console.log(replyId);
        if (replyId != null && replyId.length != 0) {
            let replyer =  await UserModel.find({"_id": replyId}, {"_id": 1, "username":1, "nickname": 1, "avatar": 1}).exec();
            if (replyer.length != 0){
                replyer = replyer[0];
                let nickname = replyer['nickname'];
                if (nickname.length == 0) {
                    nickname = replyer['username'];
                } 
                answers[i]['replyer'] = nickname;
            } else {
                answers[i]['replyer'] = '';
            }
        } else {
            answers[i]['replyer'] = '';
        }
    }
    ctx.status=200;
    ctx.body=answers;
};
const likeAnawer=async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let answerId = ctx.query.id;
    let answer = await AnswerModel.find({"_id":answerId});
    answer=answer[0];
    let newUserId = userId.toString();
    for(let i=0;i<answer.likeList.length;i++){
        if(answer.likeList[i].toString()==newUserId){
            ctx.status=403;
            ctx.body = {err:"have liked"};
            return;
        }
    }
    answer.likeList.push(userId);
    answer.likeNum+=1;
    let newAnswer = new AnswerModel(answer);
    await newAnswer.save();
    ctx.status=200;
    ctx.body={};
};
const cancelLike=async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId =token.id;
    let answerId= ctx.query.id;
    let answer =await AnswerModel.find({"_id":answerId});
    answer = answer[0];
    let newUserId = userId.toString();
    let index = answer.likeList.indexOf(newUserId);
    if(index==-1){
        ctx.status=403;
        ctx.body = "unliked";
        return ;
    }
    answer.likeList.splice(index,1);
    answer.likeNum--;
    let newAnswer = new AnswerModel(answer);
    await newAnswer.save();
    ctx.body={};
    ctx.status=200;

};
const getAnswerByAnswerId=async(ctx)=>{
    let answerId =ctx.query.id;
    let answer = await AnswerModel.find({"_id":answerId}).populate(
        {
            path:"question",
            select:{
                "_id":1,
                "questionContent":1
            }
        }
    ).exec();
    answer=commonFunction.parseJSON(answer);
    answer=answer[0];
    let userId = answer['user'];
    let user = await UserModel.find({"_id": userId}, {"_id": 1, "nickname": 1, "avatar": 1}).exec();
    user = user[0];
    answer['user']=user;
    // add fromanswer part
    let fromanswerID = answer['fromanswerID'];
    if (fromanswerID != null) {
        let fromanswer = await AnswerModel.find({"_id": fromanswerID}, {"_id":1, "user":1, "answer":1}).exec();
        fromanswer = fromanswer[0];
        answer['fromanswerID'] = fromanswer;
    }
    ctx.status=200;
    ctx.body=answer;
};
const createCommentForAnswer=async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId=token.id;
    let content = ctx.request.body.content;
    let answerId = ctx.request.body.answerId;

    let comment = {
        "user":userId,
        "content":content
    };
    await AnswerModel.update({"_id":answerId},{$push:{"comment":comment}});

    ctx.status=200;
    ctx.body={};
};

const deleteAnswerById = async(ctx)=>{
    let id = ctx.request.body.answer;
    let answer = await AnswerModel.findById(id);
    let question = await QuestionModel.findById(answer['question']);
    let answers = question['answer'];
    let index = answers.indexOf(id);
    if (index != -1) {
        answers.splice(index, 1);
        await QuestionModel.update({"_id":answer['question']}, {$set:{"answer":answers, "answerNum":answers.length}}).exec();
    }

    await AnswerModel.findByIdAndRemove(id);
    ctx.status=200;
}

module.exports.securedRouters = {
    'POST /createAnswer':createAnswer,
    'GET /likeAnawer':likeAnawer,
    'GET /cancelLike':cancelLike
};
module.exports.routers = {
    'POST /getAnswerByQuestionId':getAnswerByQuestionId,
    'GET /getAnswerByAnswerId':getAnswerByAnswerId,
    'POST /createCommentForAnswer':createCommentForAnswer,
    'DEL /deleteAnswer': deleteAnswerById
};
