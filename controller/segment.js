'use strict';

const jwt = require('../middleware/jwt');
const SegmentModel = require('../model/segment');
const commonFunction=require('../middleware/common_function');
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const http = require('http')
const qs = require('querystring')
var Algorithmia = require("algorithmia");

const judge = function (comment) {
    let promise = new Promise((resolve, reject) => {
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
        req.on('error', function(error){
            resolve('error');
        })
        req.end();
    })

    return promise;
}

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
    let segmentInfo = await SegmentModel
        .findById(ctx.params.id)
        .select({
            comments: 0
        })
        .exec()
    ctx.body = segmentInfo
}

const updateWordsList = async (ctx) => {
    let segmentInfo = await SegmentModel.findById(ctx.request.body.id).exec()
    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？%+_]");
    let words = segmentInfo.content.replace(/([ .,;\n"']+)/g, '$1§sep§').split('§sep§')
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].replace(pattern, '')
    }
    ctx.body = words
};
const weChatQuestion = async(ctx)=>{
    try
    {
        let segmentId = ctx.request.body.id;
        let segment = await SegmentModel.findById(segmentId, {"questions": 1}).exec();
        let questions = segment.questions;
        let num = questions.length > 10 ? 10 : questions.length;
        let result = commonFunction.getRandomArrayElement(questions, num);
        ctx.body = result;
        ctx.status = 200;
    }
    catch (err) {
        ctx.status = 400;
        ctx.body = {error:"error"}

    }
};
const SegmentCommentNum = async(ctx)=>{
    let id = ctx.params.myid;
    let segment = await SegmentModel.findById(id);
    ctx.body = segment.commentNum;
    ctx.status=200;
};

const judgeQuestion = async(ctx)=> {
    let comment = ctx.request.body.comment;
    let ans;
    try{
	ans = await judge(comment);
        if(ans=="error"){
            ctx.status = 200;
	    ctx.body = {is_question: comment.endsWith("?")};
        }
	else {
	    ctx.status = 200;
    	    ctx.body = {is_question: JSON.parse(ans)['flag']};
	}
    }
    catch(err) {
        console.log(err);
        ctx.status = 400;
        ctx.body = {error: "error"}
    }
}

const split_sentence = async(ctx)=> {
    let content = ctx.request.body.content;
    console.log(content);
    let res = await Algorithmia.client("simPiZAZYl2np5CFIyB5UAcPAGW1").algo("StanfordNLP/SentenceSplit/0.1.0").pipe(content);
    ctx.body = {sentences: res.get()}
    ctx.status = 200;
}

module.exports.securedRouters = {
};

module.exports.routers = {
    'POST /segment/weChatQuestion':weChatQuestion,
    'GET /SegmentCommentNum/:myid':SegmentCommentNum,
    'GET /segment': list,
    'POST /segment': create,
    'GET /segment/:id': getInfoById,
    'POST /segment/words': updateWordsList,
    'POST /segment/judge': judgeQuestion,
    'POST /split_sentence': split_sentence
};
