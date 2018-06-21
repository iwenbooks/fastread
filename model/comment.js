'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    "content": { type: String },
    "user": { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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