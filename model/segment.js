'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const segmentSchema = new Schema({
    "content": { type: String },
    "level": { type: Number },
    "words": [{ type: mongoose.Schema.Types.ObjectId, ref: 'Word' }],
    "created": { type: Date, default: Date.now, index: true },
    "updated": { type: Date, default: Date.now, index: true }
});

segmentSchema.pre('save', function (next) {
    this.updated = Date.now();
    next();
});

const Segment = mongoose.model('Segment', segmentSchema);

module.exports = Segment;