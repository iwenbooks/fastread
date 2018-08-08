'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const authorSchema = new Schema({
    "name": { type: String, index: { unique: true, dropDups: true } },
    "books": [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
});

authorSchema.pre('save', function (next) {
    this.updated = Date.now();
    next();
});

const Author = mongoose.model('Author', authorSchema);

module.exports = Author;