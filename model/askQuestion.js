'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const askQuestionSchema = new Schema({
    "presenter": { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    "book":{type:mongoose.Schema.Types.ObjectId,ref:'Book'},
    "segment": { type: mongoose.Schema.Types.ObjectId, ref: 'Segment' },
    "questionContent":{type:String},
    "answer":[{type:mongoose.Schema.Types.ObjectId,ref:'Answer'}],
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true },
    "answerNum":{type:Number,default:0},
    "index": { type: Number, default:-1},
    "isQuestion": { type: Boolean, default:false},
});
askQuestionSchema.pre('save',(next)=>{
    this.updated=Date.now();
    next();
});
const AskQuestion = mongoose.model('AskQuestion',askQuestionSchema);
module.exports=AskQuestion;