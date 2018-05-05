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

function randomFetch(filter, options) {
    return new Promise((resolve, reject) => {
        WordModel.findRandom(filter, {}, options, function (err, results) {
            if (err) {
                reject(err)
            } else {
                resolve(results)
            }
        });
    })
}

// TODO: the levels config
const getTestSet = async (ctx) => {
    let levels = ctx.params.levels || [0, 1, 2, 3, 4, 5]
    let limit = ctx.params.limit || 2;
    let words = []
    words = words.concat(await randomFetch({ level: 0 }, { limit: 2 }));
    words = words.concat(await randomFetch({ level: 1 }, { limit: 2 }));
    words = words.concat(await randomFetch({ level: 2 }, { limit: 2 }));
    words = words.concat(await randomFetch({ level: 3 }, { limit: 2 }));
    ctx.body = words;
}

const create = async (ctx) => {
    let word = ctx.request.body.word;
    let level = ctx.request.body.level;
    let explanations = ctx.request.body.explanations;
    let sentences = ctx.request.body.sentences;
    let pronunciations = ctx.request.body.pronunciations;
    let chineseExplanations = ctx.request.body.chineseExplanations;
    let nyfreq = ctx.request.body.nyfreq;

    try {
        let newWord = await new WordModel({
            word: word,
            level: level,
            explanations: explanations,
            sentences: sentences,
            pronunciations: pronunciations,
            chineseExplanations: chineseExplanations,
            nyfreq: nyfreq
        }).save()
        ctx.status = 200;
        ctx.body = { _id: newWord._id };
    } catch (error) {
        ctx.status = 403;
        // TODO: error code
        ctx.body = { "error": "error" }
    }
}

const getInfoById = async (ctx) => {
    let wordInfo = await WordModel.findById(ctx.params.id).exec()
    ctx.body = wordInfo
}

module.exports.securedRouters = {
};

module.exports.routers = {
    'POST /word': create,
    'GET /word': list,
    'GET /test': getTestSet,
    'GET /word/:id': getInfoById
};