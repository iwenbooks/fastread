'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookSchema = new Schema({
    "bookname": { type: String },
    "author": { type: String },
    "cover": { type: String },
    "segments": [{ type: mongoose.Schema.Types.ObjectId, ref: 'Segment' }],
    "level": { type: Number },
    "downloads": { type: Number },
    "gutenburgId": { type: Number },
    "category": [{ type: String }],
    "year": { type: String },
    "publisher": { type: String },
    "commentary": { type: String },
    "likes": [{ type: mongoose.Schema.Types.ObjectId, ref: 'Segment' }],
    "likeNum": { type: Number },
    "numberOfReading":{type:Number,default :0},
    "comments": [
        {type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}
    ]
});

bookSchema.pre('save', function (next) {
    this.updated = Date.now();
    next();
});
bookSchema.statics.searchByAuthorOrBookName=function (query) {
    return Book.find({$or:[{"bookname":{$regex:query}},{"author":{$regex:query}}]});
}

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
