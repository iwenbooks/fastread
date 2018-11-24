'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const suggestSchema = new Schema({
    "content": { type: String },
    "user": { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true },
    "source": { type: Number, index: true }
});

suggestSchema.pre('save', function (next) {
    this.updated = Date.now();
    next();
});

const Suggest = mongoose.model('Suggest', suggestSchema);

module.exports = Suggest;
