'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const awardListSchema = new Schema({
    "name": { type: String, index: { unique: true, dropDups: true } },
    "books": [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    "abstract": { type: String},
    "cover": { type: String}
});

awardListSchema.pre('save', function (next) {
    this.updated = Date.now();
    next();
});

const AwardList = mongoose.model('AwardList', awardListSchema);

module.exports = AwardList;