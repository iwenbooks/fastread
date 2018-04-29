'use strict';

const crypto = require('crypto');
const jwt = require('../middleware/jwt')
const WordModel = require('../model/word');
const ERRORCODE = require('../CONSTANTS').ERRORCODE;

const list = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = 10;
    let skip = (page - 1) * limit;
    let words = await WordModel.find().exec();
    ctx.body = words;
}

const getTestSet = async (ctx) => {
    // TODO: random
    let words = await WordModel.find().limit(10).exec();
    ctx.body = words;
}

const create = async (ctx) => {
    let word = ctx.request.body.word;
    let level = ctx.request.body.level;
    let explanations = ctx.request.body.explanations;
    let sentences = ctx.request.body.sentences;
    let pronunciations = ctx.request.body.pronunciations;
    let chineseExplanations = ctx.request.body.chineseExplanations;

    try {
        let newWord = new WordModel({
            word: word,
            level: level,
            explanations: explanations,
            sentences: sentences,
            pronunciations: pronunciations,
            chineseExplanations: chineseExplanations
        }).save()
        ctx.status = 200;
        ctx.body = {};
    } catch (error) {
        ctx.status = 403;
        // TODO: error code
        ctx.body = { "error": "error" }
    }
}

module.exports.securedRouters = {
};

module.exports.routers = {
    'POST /word': create,
    'GET /word': list,
    'GET /test': getTestSet
};