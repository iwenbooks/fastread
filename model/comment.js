'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    "content": { type: String },
    "star":{type:Number,default:0},
    "user": { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    "book": { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    "segment": { type: mongoose.Schema.Types.ObjectId, ref: 'Segment' },
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true },
    "likes": [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    "likeNum": { type: Number, default: 0}
});

commentSchema.pre('save', function (next) {
    this.updated = Date.now();
    next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
