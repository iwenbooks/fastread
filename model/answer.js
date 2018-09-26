'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const answerSchema = Schema({
    "question":{ type: mongoose.Schema.Types.ObjectId, ref: 'AskQuestion'},
    "user":{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    "answer":{type:String},
    "comment":[{
        "user":{type:mongoose.Schema.Types.ObjectId, ref:'User'},
        "content":{type:String},
        "likeNum":{type:Number,default:0}
    }],
    "likeNum":{type:Number,default:0},
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true }
});

answerSchema.pre('save',(next)=>{
    this.updated = Date.now();
    next();
});
const Answer = mongoose.model('Answer',answerSchema);
module.exports=Answer;