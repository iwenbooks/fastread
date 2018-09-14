'use strict';

const crypto = require('crypto');
const jwt = require('../middleware/jwt')
const WordModel = require('../model/word');
const ERRORCODE = require('../CONSTANTS').ERRORCODE;
const path = require('path');

const list = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = 10;
    let skip = (page - 1) * limit;
    let words = await WordModel.find().skip(skip).limit(limit).exec();
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
    let levels = ctx.params.levels || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    let limit = ctx.params.limit || 10;
    let words = []
    for (let i = 0; i < levels.length; i++) {
        let  word =await randomFetch({ level: levels[i] }, { limit: limit });
        if(word!=undefined){       
            console.log(word[0]["word"][0]);
            if(/^[A-Z].*/.test(word[0]["word"][0])){
                i--;
            }else{
                words.push(word);
            }
        }
    }
    ctx.body = words;
    ctx.status=200;
}
const getTestSetWord = async (ctx) => {
    let levels = ctx.params.levels || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    let limit = ctx.params.limit || 10;
    let words = []
    for (let i = 0; i < levels.length; i++) {
        let  word =await randomFetch({ level: levels[i] }, { limit: limit });
        if(word!=undefined){       
            console.log(word[0]["word"][0]);
            if(/^[A-Z].*/.test(word[0]["word"][0])){
                i--;
            }else{
                let wordlist = []
                for (let i in word) {
                    wordlist.push(word[i].word)
                }
                words.push(wordlist);
            }
        }
    }
    ctx.body = words;
    ctx.status=200;
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
};

const getInfoById = async (ctx) => {
    let wordInfo = await WordModel.findById(ctx.params.id);
    ctx.body = wordInfo
    ctx.status = 200;
};

function getLemma(word){
    let lemma = null;
    let tryTimes = 3;
    while(tryTimes > 0){
        try{
            var java = require("java");
            java.classpath.push(path.resolve(__dirname, './src'));
            java.classpath.push(path.resolve(__dirname, './src/lib/opennlp-tools-1.8.4.jar'));
            lemma = java.callStaticMethodSync("lemmatizer.Lemmatize", "getLemma", word);
            break;
        }
        catch(e){
            tryTimes -= 1;
        }
    }
    if(lemma == null || lemma == "O") lemma = word;
    return lemma;
}

const getLemmaByWord = async (ctx) => {
    let word = ctx.params.word;
    let lemma = getLemma(word);
    let wordInfo = await WordModel.find({
        word: lemma
    });
    if(wordInfo.length == 0){
        word = word.toLowerCase();
        lemma = getLemma(word);
        wordInfo = await WordModel.find({
            word: lemma
        });
    }
    ctx.body = wordInfo[0];
};

const updateByWord = async (ctx) => {
    let chineseExplanations = ctx.request.body.chineseExplanations;
    let word = ctx.request.body.word
    await WordModel.update({"word":word},{$set:{"chineseExplanations":chineseExplanations}}).exec();
    ctx.status = 200;
};


const getInfoByWord = async (ctx) => {
    let wordInfo = await WordModel.find({"word":ctx.params.word});
    if (wordInfo.length > 0) {
        ctx.body = wordInfo[0]
        ctx.status = 200;
    } else {
        ctx.status = 204;
    }
};

module.exports.securedRouters = {
};


module.exports.routers = {
    'POST /word': create,
    'GET /word': list,
    'GET /test': getTestSet,
    'GET /testword': getTestSetWord,
    'GET /word/:id': getInfoById,
    'GET /wordlemma/:word': getLemmaByWord,
    'GET /wordname/:word': getInfoByWord,
    'POST /word/update': updateByWord
};
