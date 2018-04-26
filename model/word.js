'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wordSchema = new Schema({
    "word": { type: String, index: { unique: true, dropDups: true } },
    "level": { type: String },
    "explanation": [{ type: mongoose.Schema.Types.ObjectId, ref: 'Word' }],
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true },
});

wordSchema.pre('save', function (next) {
    this.updated = Date.now();
    next();
});

const Word = mongoose.model('Word', wordSchema);

module.exports = Word;