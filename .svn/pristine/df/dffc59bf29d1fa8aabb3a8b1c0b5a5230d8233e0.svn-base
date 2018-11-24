'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const segmentSchema = new Schema({
    "content": { type: String },
    "name": {type: String},
    "level": { type: Number },
    "words": [{ type: mongoose.Schema.Types.ObjectId, ref: 'Word' }],
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true },
    "comments": [
        {type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}
    ],
    "commentNum":{type:Number, default:0},
    "questions":[
        {
            "question":{type:String,default:''},
            "answer":[]
    }
    ]

});

segmentSchema.pre('save', function (next) {
    this.updated = Date.now();
    next();
});

const Segment = mongoose.model('Segment', segmentSchema);

module.exports = Segment;
