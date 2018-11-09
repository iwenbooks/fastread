'use strict';
const crypto = require('crypto');
const jwt = require('../middleware/jwt');
const UserModel = require('../model/user');
const BookModel = require('../model/book');
const CommentModel = require('../model/comment');
const SegmentModel = require("../model/segment");
const WordModel = require('../model/word');
const config = require('../config');
const ERRORCODE = require('../CONSTANTS').ERRORCODE;
const nlp_config_path = require('../CONSTANTS').NLPCONFIGPATH;
const commonFunction = require('../middleware/common_function');
const request = require('request');
const path = require('path');
const fs = require('fs');
const appid="wx7a4f658c7ff6cee3";
const appsecret="56c48cca391a9463a74803c5f625833c";
const loginForWechat = async(ctx)=>{
    let url ="https://api.weixin.qq.com/sns/jscode2session?appid="+appid+"&secret="+appsecret+"&js_code="+ctx.params.code+"&grant_type=authorization_code";
    // console.log(url);
    ctx.body =await request(url);
    ctx.status=200;
};

const list = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = 10;
    let skip = (page - 1) * limit;
    let users = await UserModel.find().skip(skip).limit(limit).exec();
    ctx.body = users;
};

const auth = async (ctx) => {
    let username = ctx.request.body.username;
    let password = ctx.request.body.password;
    let user = await UserModel.findByUsername(username);
    if (user) {
        let shasum = crypto.createHash('sha1');
        shasum.update(password);
        if (user.password === shasum.digest('hex')) {
            ctx.status = 200;
            ctx.body = {
                token: jwt.issue({
                    id: user._id,
                    user: username
                })
            }
        } else {
            ctx.status = 403;
            ctx.body = { error: "Invalid login" };
        }
    } else {
        ctx.status = 401;
        ctx.body = { error: "Invalid login" }
    }
};
const authByPhone = async(ctx)=>{
    let phoneNumber =ctx.request.body.phone;
    let password  =ctx.request.body.password;
    let user = await UserModel.findOne({"phone":phoneNumber});
    if (user) {
        let shasum = crypto.createHash('sha1');
        shasum.update(password);
        if (user.password === shasum.digest('hex')) {
            ctx.status = 200;
            ctx.body = {
                token: jwt.issue({
                    id: user._id,
                    user: user.username
                })
            }
        } else {
            ctx.status = 403;
            ctx.body = { error: "Invalid login" };
        }
    } else {
        ctx.status = 401;
        ctx.body = { error: "Invalid login" }
    }
}
const authByWechat = async (ctx) => {
    let wechatOpenId = ctx.request.body.wechatOpenId;
    let avatar = ctx.request.body.avatar;
    let nickname = ctx.request.body.nickname;
    let user = await UserModel.findOne({ 'wechatOpenId': wechatOpenId });
    if (user) {
        ctx.status = 200;
        ctx.body = {
            token: jwt.issue({
                id: user._id,
                wechatOpenId: wechatOpenId
            })
        }
    } else {
        user = new UserModel({
            wechatOpenId: wechatOpenId,
            avatar: avatar,
            nickname: nickname,
            username: wechatOpenId,
            level: -1
        })
        try {
            let newUser = await user.save();
            ctx.status = 200;
            ctx.body = {
                token: jwt.issue({
                    id: newUser._id,
                    wechatOpenId: newUser.wechatOpenId
                })
            }
        } catch (error) {
            ctx.status = 403;
            // console.log(error);
            ctx.body = { "errorCode": ERRORCODE.DUPLICATE_USERNAME }
        }
    }
};

const register = async (ctx) => {
    let username = ctx.request.body.username;
    let password = ctx.request.body.password;
    let phone = ctx.request.body.phone;

    let findUsername = await UserModel.find({"username":username});
    if (findUsername.length == 0) {
        let findPhone = await UserModel.find({"phone":phone});
        if (findPhone.length == 0) {
            let user = new UserModel({
                username: username,
                password: password,
                phone: phone,
                level: -1
            });

            try {
                let newUser = await user.save();
                ctx.status = 200;
                ctx.body = {};
            } catch (error) {
                ctx.status = 401;
                ctx.body = {};
            }
        } else{
            ctx.status = 403;
            ctx.body = { "errorCode": ERRORCODE.DUPLICATE_PHONE };
        }
    } else {
        ctx.status = 403;
        ctx.body = { "errorCode": ERRORCODE.DUPLICATE_USERNAME };
    }
};

const myInfo = async (ctx) => {
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let user = await UserModel
        .find({"_id":userId},{"books.segment":0,"words":0,"collectWords":0})
        .populate(
            {
                path: 'books.book',
                select: {
                    id: 1,
                    bookname: 1,
                    cover:1,
                    category:1
                },

            }
        )
        .exec();
    ctx.status = 200;
    ctx.body = user[0];
};
const getWords=async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId= token.id;
    let user = await UserModel.find({"_id":userId},{"words.word":1})
        .populate(
            {
                path:'words.word',
                select:{
                    id:1,
                    word:1
                }
            }

        )
        .exec();
    try {
        let result = user[0]["words"];
        let finalRes = [];
        for(let i=result.length-1; i>=0; i--){
            finalRes.push(result[i]["word"]);
        }
        ctx.body =finalRes;

    }
    catch (e) {
        ctx.body=[];
    }
    ctx.status =200;
};
const getCollectWords=async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId= token.id;
    let user = await UserModel.find({"_id":userId},{"collectWords.word":1})
        .populate(
            {
                path:'collectWords.word',
                select:{
                    id:1,
                    word:1
                }
            }

        )
        .exec();
    try {
        let result = user[0]["collectWords"];
        let finalRes = [];
        for(let i=result.length-1; i>=0; i--){
            finalRes.push(result[i]["word"]);
        }
        ctx.body =finalRes;

    }
    catch (e) {
        ctx.body=[];
    }
    ctx.status =200;
};
const whetherInCollectWords= async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId= token.id;
    let judgeWord = ctx.request.body.word;
    let user = await UserModel.find({"_id":userId},{"collectWords.word":1}).exec();
    for(let item of user[0].collectWords){
        if(item.word==judgeWord){
            ctx.body =true;
            ctx.status=200;
            return;
        }
    }
    ctx.body=false;
    ctx.status=200;
};

const getMyComments = async (ctx) => {
    let page = Number(ctx.query.page) || 1;
    let limit = Number(ctx.query.limit) || 10;
    let skip = (page - 1) * limit;
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let myComments = await CommentModel.find({"user":userId})
        .populate({path:'book',select:'_id bookname cover author'})
        .populate({path:'segment',select:'_id name'})
        .skip(skip)
        .limit(limit)
        .exec();
    ctx.body = myComments
};

const getInfoById = async (ctx) => {
    let userInfo = await UserModel
        .findById(ctx.params.id)
        .select("_id avatar username nickname")
        .exec();
    ctx.body = userInfo
};

const updateInfo = async (ctx) => {
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let user = await UserModel.findByIdAndUpdate(
        userId,
        ctx.request.body
    );
    ctx.status = 200;
    ctx.body = {};
}

const updatePhone = async (ctx) => {
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let phone = ctx.request.body.phone;

    let user = await UserModel.findById(userId);
    let checkPhone = await UserModel.findOne({ 'phone': phone });
    if (checkPhone) {
        ctx.status = 403;
        ctx.body = { error: "Phone number already exist!" }
    } else {
        user.phone = phone;
        user = await user.save();
        ctx.status = 200;
        ctx.body = {}
    }
}

const updateLevel = async (ctx) => {
    let newLevel = ctx.request.body.level;
    newLevel = newLevel > 9 ? 9 : newLevel;
    newLevel = newLevel < 1 ? 1 : newLevel;
    let token = jwt.getToken(ctx)
    let userId = token.id;
    let user = await UserModel.findByIdAndUpdate(
        userId,
        {
            level: newLevel
        }
    );
    ctx.status = 200;
    ctx.body = {};
}

const updateWords = async (ctx) => {

    // TODO: use user token
    let updateWords = ctx.request.body.updateWords;
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let user = await UserModel.findById(userId);
    let level  = user.level;

    for (let i = 0; i < updateWords.length; i++) {
        let isNewWord = true;
        for (let j = 0; j < user.words.length; j++) {
            if (String(user.words[j].word) == updateWords[i]) {
                user.words[j].times++;
                isNewWord = false;
            }
        }
        let wordInfo = await WordModel.findById(updateWords[i])
        if (isNewWord) {
            user.words.push({
                word: updateWords[i],
                times: 1,
                level: wordInfo['level']
            })
        }
    }
    user = await user.save();

    let learnWordsNum = 0;
    for (let i = 0; i < user.words.length; i++) {
        if ('level' in user.words[i] && user.words[i]['level'] == level) {
            learnWordsNum++;
        }
    }
    let totalLevelWord = await WordModel.find({"level":level}).count();
    console.log(totalLevelWord,'\t',learnWordsNum); 
    let judgeExceedLevelWords = learnWordsNum/totalLevelWord>0.7?true:false;

    ctx.status = 200;
    ctx.body = judgeExceedLevelWords;
};

const updateCollectWords = async (ctx) => {
    // TODO: use user token
    let updateWords = ctx.request.body.updateWords;
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let user = await UserModel.findById(userId);
    updateWords.forEach(word => {
        let isNewWord = true;
        for (var i = 0; i < user.collectWords.length; i++) {
            if (String(user.collectWords[i].word) === word) {
                isNewWord = false;
            }
        }
        if (isNewWord) {
            user.collectWords.push({
                word: word,
            })
        }
    });
    user = await user.save();
    ctx.status = 200;
    ctx.body = {};
};

const tmpTest = async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId= token.id;
    let word =await WordModel.find({}).limit(50000).exec();
    await UserModel.findByIdAndUpdate(userId,{"collectWords":word});
    ctx.status=200;
    ctx.body={};
};

const updateBookProgress = async (ctx) => {
    let updateBook = ctx.request.body.book;
    let index = ctx.request.body.segment;
    let token = jwt.getToken(ctx);
    let userId = token.id;
    try {
        let book = await BookModel.findById(updateBook);
        if (index < 0 || index > book.segments.length) {
            ctx.status = 401;
            ctx.body = {error: "Invalid segment"};
            return;
        }
        let judge = false;
        let segmentLength = book.segments.length;
        let currentUser = await UserModel.findById(userId);
        if (segmentLength == index) {
            judge = true;
            let num = currentUser.status.totalReadingBooks + 1;
            await UserModel.findByIdAndUpdate(userId, {$set: {"status.totalReadingBooks": num}});
        }
        let totalChapter = currentUser.status.totalChapters+1;
        await UserModel.findByIdAndUpdate(userId, {$set: {"status.totalChapters": totalChapter}});
        await UserModel.update(
            {
                "_id": userId,
                "books": {$elemMatch: {book: updateBook}}
            },
            {
                $set: {
                    "books.$.whetherOrNotToRead": judge, "books.$.currentSegment": index,
                    "books.$.totalSegment": segmentLength
                }
            });
        ctx.status = 200;
        ctx.body = {};
    }
    catch(error){
        ctx.body={error:error};
        ctx.status = 401;
    }
};
const addBook = async (ctx) => {
    // TODO: use user token
    let newBookId = ctx.request.body.book;
    try {
        let book = await BookModel.findById(newBookId);
        let totalSegmentLength = book.segments.length;
        // console.log(totalSegmentLength);
        let num = book.numberOfReading+1;
        await BookModel.update({"_id":newBookId},{$set:{"numberOfReading":num}});
        let token = jwt.getToken(ctx);
        let userId = token.id;
        let user = await UserModel.findById(userId);
        // Check if the book already been read
        user.books.forEach(book => {
            if (String(book.book) === newBookId) {
                ctx.throw(400, 'The book has already been added in user\'s read list!')
            }
        });
        user.books.push({
            book: newBookId,
            segment: book.segments[0],
            totalSegment:totalSegmentLength
        });
        user = await user.save();
        ctx.status = 200;
        ctx.body = totalSegmentLength;
    } catch (error) {
        ctx.status = 401;
        ctx.body = { error: error }
    }
};
const removeCollectWord=async(ctx)=>{
    let removeWord = ctx.request.body.word;
    try{
        let token = jwt.getToken(ctx);
        let userId=token.id;
        let user = await UserModel.findById(userId);
        let tmp=[];
        for(let i=0;i<user.collectWords.length;i++){
            if(user.collectWords[i]['word']!=removeWord){
                tmp.push(user.collectWords[i]);
            }
        }
        await UserModel.update({"_id":userId},{"collectWords":tmp})
        ctx.body={}
    }catch (err) {
        ctx.status=401;
        ctx.body={error:err}

    }
};

const removeBook = async (ctx) => {
    let newBookId = ctx.request.body.book;
    try {
        let token = jwt.getToken(ctx);
        let userId = token.id;
        let user = await UserModel.findById(userId);
        let tmp = [];
        // console.log(1111);
        for(let i = 0;i<user.books.length;i++){
            if(user.books[i]["book"]!=newBookId){
                tmp.push(user.books[i]);
            }
        }
        await UserModel.update({"_id":userId},{"books":tmp});
        ctx.body = {};
    } catch (error) {
        ctx.status = 401;
        ctx.body = { error: error }
    }
};

const getRecommendedBooks = async (ctx) => {
    try {
        let token = jwt.getToken(ctx);
        let userId = token.id;
        let user = await UserModel.findById(userId);
        let userBookList = [];
        user.books.forEach(book => {
            userBookList.push(book.book)
        });
        let books = await BookModel.find({
            level: user.level,
            _id: { "$nin": userBookList} ,
            commentary: {"$exists": true, "$regex": /^.{5,}$/}
        })
            .select({
            segments: 0
        }).collation({"locale": "en", numericOrdering:true})
            .sort({
            goodreads_ratings:-1,
            goodreads_ratingVal:-1,
            cover:-1,
            likeNum: -1,
            numberOfReading:-1,
            downloads:-1,
            CommentNum:-1
        }).limit(30).exec();
        ctx.body =await commonFunction.getRandomArrayElement(books,3);
        ctx.status = 200;
    } catch (error) {
        ctx.status = 401;
        ctx.body = { error: error }
    }
};
const updateSetting = async(ctx)=>{
    try {
        let token = jwt.getToken(ctx);
        let userId = token.id;
        let user = await UserModel.findByIdAndUpdate(userId, ctx.request.body);
        ctx.status =200;
    }catch (e) {
        ctx.status=400;
        ctx.body = {error:"Bad Request"}
    }
};

const updateRecord = async (ctx) => {
    try {
        let token = jwt.getToken(ctx);
        let userId = token.id;
        let user = await UserModel.findById(userId);

        let book = ctx.request.body.book;
        let segment = ctx.request.body.segment;
        let time = ctx.request.body.time;
        let score = ctx.request.body.score;
        let isNewRecord = true;

        for (var i = 0; i < user.records.length; i++) {
            if (String(user.records[i].segment) === segment) {
                user.records[i].time = time;
                user.records.score = score;
                isNewRecord = false;
            }
        }
        if (isNewRecord) {
            user.records.push({
                book: book,
                segment: segment,
                time: time,
                score: score
            })
        }

        user = await user.save();
        ctx.status = 200;
        ctx.body = {};
    } catch (error) {
        ctx.status = 401;
        ctx.body = { error: error }
    }
};

const updateStatus = async (ctx) => {
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let status = ctx.request.body.status;

    try {
        let user = await UserModel.findByIdAndUpdate(
            userId,
            {
                status: status
            }
        );
        ctx.status = 200;
        ctx.body = {};
    } catch (error) {
        ctx.status = 403;
        ctx.body = { error: error }
    }
};

const consecutiveRTime=async (ctx)=>{
    let token = jwt.getToken(ctx);
    let userId= token.id;
    let result;
    let user = await UserModel.findById(userId);
    let judgeWhetherReadYesterday=await UserModel.timeDifference(user.status.lastReadDate);
    if (judgeWhetherReadYesterday==1){
        result = user.status.continuousReadingDayCount+1;
    }else if(judgeWhetherReadYesterday==2){
        result = user.status.continuousReadingDayCount;
    }else{
        result = 0;
    }
    await UserModel.findByIdAndUpdate(userId,{$set:{"status.continuousReadingDayCount":result,"status.lastReadDate":new Date()}})
    ctx.body = result;
    ctx.status =200;
}
const totalReadingWords = async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId=token.id;
    let user = await UserModel.findById(userId);
    let result =parseInt(ctx.params.query)+user.status.totalReadingWords;
    await UserModel.findByIdAndUpdate(userId,{$set:{"status.totalReadingWords":result}});
    ctx.body = result;
    ctx.status = 200;
}

const totalReadingBooks = async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId=token.id;
    let user = await UserModel.findById(userId);
    let result =parseInt(ctx.params.query)+user.status.totalReadingBooks;
    await UserModel.findByIdAndUpdate(userId,{$set:{"status.totalReadingBooks":result}});
    ctx.body = result;
    ctx.status = 200;
};

const totalAnswers = async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId=token.id;
    let user = await UserModel.findById(userId);
    let result =parseInt(ctx.params.query)+user.status.totalAnswers;
    await UserModel.findByIdAndUpdate(userId,{$set:{"status.totalAnswers":result}});
    ctx.body = result;
    ctx.status = 200;
};

const totalCorrectAnswers = async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId=token.id;
    let user = await UserModel.findById(userId);
    let result =parseInt(ctx.params.query)+user.status.totalCorrectAnswers;
    await UserModel.findByIdAndUpdate(userId,{$set:{"status.totalCorrectAnswers":result}});
    ctx.body = result;
    ctx.status = 200;
};

const totalLearnedWords=async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId=token.id;

    let user = await UserModel.findById(userId);
    let result =parseInt(ctx.params.query)+user.status.totalLearnedWords;
    await UserModel.findByIdAndUpdate(userId,{$set:{"status.totalLearnedWords":result}});
    ctx.body = result;
    ctx.status = 200;
};
const totalChapters=async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId=token.id;
    let user = await UserModel.findById(userId);
    let result =parseInt(ctx.params.query)+user.status.totalChapters;
    await UserModel.findByIdAndUpdate(userId,{$set:{"status.totalChapters":result}});
    ctx.body = result;
    ctx.status = 200;
};
const totalReadingTime=async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId=token.id;
    let user = await UserModel.findById(userId);
    let result =parseInt(ctx.params.query)+user.status.totalReadingTime;
    await UserModel.findByIdAndUpdate(userId,{$set:{"status.totalReadingTime":result}});
    ctx.body = result;
    ctx.status = 200;
};
const likeBook = async(ctx)=>{
    let userLikeBookId = ctx.request.body.book;
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let user = await UserModel.findById(userId).exec();

    let books = user["books"];

    let hasLiked = null;
    for(let i = 0; i < books.length; i++){
        if(String(books[i].book) == userLikeBookId){
            hasLiked = books[i].like;
            break;
        }
    }

    if(hasLiked != null && !hasLiked){
        await UserModel.update(
        {"_id":userId,
        "books":{$elemMatch: {book:userLikeBookId}}},
        {$set:{"books.$.like":true     
        }});
        let book =await BookModel.findById(userLikeBookId);
        if(book != null){
            let likesNum = book["likeNum"]+1;
            await BookModel.update({"_id":userLikeBookId},{$set:{"likeNum":likesNum}}) ;
        }
    }
    ctx.status =200;    
};
const unLikeBook=async(ctx)=>{
    let userLikeBookId = ctx.request.body.book;
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let user = await UserModel.findById(userId).exec();
    let books = user["books"];
    let hasLiked = null;
    for(let i = 0; i < books.length; i++){
        if(String(books[i].book) == userLikeBookId){
            hasLiked = books[i].like;
            break;
        }
    }
    if(hasLiked != null && hasLiked){
        await UserModel.update(
        {"_id":userId,
        "books":{$elemMatch: {book:userLikeBookId}}},
        {$set:{"books.$.like":false     
        }});
        let book =await BookModel.findById(userLikeBookId);
        if(book != null){
            let likesNum = book["likeNum"]-1;
            await BookModel.update({"_id":userLikeBookId},{$set:{"likeNum":likesNum}}) ;
        }
    }
    ctx.status =200;   
    
};

const getLevelWord= async(ctx)=>{
    try{
        let segmentId = ctx.request.body.id;
        let token = jwt.getToken(ctx);
        let userId=token.id;
        let user = await UserModel.findById(userId).exec();
        let haveReadWord =user["words"];
        let segment = await SegmentModel.findById(segmentId).exec();
        if(segment){
            let content = segment["content"];
			/*
            if(content.length>50000){
                let randomWord = content[Math.ceil(Math.random()*100)].toLocaleLowerCase();
                let num = randomWord>"m"?50000:0;
                let endIdx = num + 50000 >= content.length ? content.length : num + 50000;
                // content=content.slice(num,num+50000);
                content=content.slice(num,endIdx);
            }
			*/
            let wordList = [];
            let wordsId = [];
            let userLevel = user.level > 9 ? 0 : user.level;
            let resWord=[];

            if("words" in segment){
                wordList = segment['words'];
            }
            if(wordList.length == 0){
                wordList=content.replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\d+|\'|\·|\,|\<|\.|\>|\/|\?]|(\r\n)|(\n)/g," ").split(" ");
                content = null;
                wordList = wordList.filter((word,index,self)=>{
                    word =word.toLocaleLowerCase();
                    return word.length>=2&&self.indexOf(word)===index;
                }) 

                let resultArr = [];

                let tryTimes = 3;
                while(tryTimes > 0){
                    try{
                        var java = require("java");
                        java.classpath.push(path.resolve(__dirname, './src'));
                        java.classpath.push(path.resolve(__dirname, './src/lib/opennlp-tools-1.8.4.jar'));
                        var runInterface = java.newInstanceSync("lemmatizer.LemmatizeText", nlp_config_path);
                        java.callMethodSync(runInterface, "lemmatizeWordList", 
                                            JSON.stringify(wordList)
                                            );
                        let resultStr = java.callMethodSync(runInterface, "getLemmaListJson");

                        resultArr = JSON.parse(resultStr);
                        break;
                    }
                    catch(e){
                        tryTimes -= 1;
                    }
                }

                let lemmaSuccess = null;
                if(resultArr == null){
                    lemmaSuccess = false;
                    resultArr = wordList;
                }
                else{
                    if(resultArr.length == 0){
                        lemmaSuccess = false;
                        resultArr = wordList;
                    }
                    else lemmaSuccess = true;
                }

                let allWordDir = await WordModel.find({"level":{$gte: 1, $lte: 9}},{"explanations":0}).exec();

                for(let i=0;i<resultArr.length;i++){
                    let tempWord=resultArr[i];
                    for(let j=0;j<allWordDir.length;j++){
                        if(tempWord==allWordDir[j]['word']){
                            wordsId.push(allWordDir[j]['id']);
                            if(allWordDir[j]['level'] == userLevel){
                                resWord.push(allWordDir[j]);
                            }
                            break;
                        }
                    }
                }
                if(lemmaSuccess)
                    await SegmentModel.findByIdAndUpdate(segmentId, {$set: {"words": wordsId}});
            }
            else{
                for(let i = 0; i < wordList.length; i++){
                    let wordInfo = await WordModel.findById(wordList[i],{"explanations":0});
                    if(wordInfo['level'] == userLevel)
                        resWord.push(wordInfo);
                }
            }

            let learnWord = [];
            for(let i=0;i<resWord.length;i++){
                let k = 0;
                for(let j=0;j<haveReadWord.length;j++){
                    if(haveReadWord[j]["word"].toString() == resWord[i]["id"].toString()){
                        k = 1;
                    }
                }
                if (k == 0) {
                    learnWord.push(resWord[i]);
                }
            }
            let wordLength = learnWord.length>10?10:learnWord.length;
            let result=await commonFunction.getRandomArrayElement(learnWord,wordLength);
            ctx.body=result;
        }else{
            ctx.status = 404;
            ctx.body={error:"invalid segment ID"};
        }
    }
    catch(e){
        console.log("400 exception: " + e);
        ctx.status = 400;
        ctx.body={error:"exception"};
    }
};

const deleteComments = async(ctx)=>{
    let token  =jwt.getToken(ctx);
    let commentId = ctx.request.body.commentId;
    let comment = await CommentModel.findById(commentId);
    let segmentId = comment["segment"]
    if (segmentId != null) {
        let segment =  await SegmentModel.findById(segmentId);
        let commentNum = segment["commentNum"] - 1;
        await SegmentModel.update({"_id":segmentId}, {$set:{"commentNum":commentNum}}).exec();
    }
    else {
        let book = await BookModel.findById(comment["book"]);
        let commentNum = book["CommentNum"]-1;
        let tmp = [];
        for (let i = 0; i < book["comments"].length; i++){
            if (book["comments"][i] != commentId){
                tmp.push(book["comments"][i]);
            }
        }
        await BookModel.update({"_id":comment["book"]},{$set:{"CommentNum":commentNum, "comments":tmp}}).exec();
    }
    await CommentModel.remove({"_id":commentId}).exec();
    ctx.status = 200;
}
const updatePassword = async(ctx)=>{
    let phone = ctx.request.body.phone;
    let password = ctx.request.body.password;//目前默认为post已经经过sha1加密的字符串
    let user = await UserModel.find({"phone":phone}).exec();
    if(user.length>0){
        await UserModel.update({"phone":phone},{$set:{"password":password}}).exec();
        ctx.status=200;
    }else {
        ctx.status=401;
        ctx.body={};
    }

};
const uploadAvatar = async ctx => {
    let token = jwt.getToken(ctx)
    let userId = token.id;
    ctx.req.part.pipe(
      fs.createWriteStream(config.avatar_path + userId + '.jpg')
    );
    let user = await UserModel.findByIdAndUpdate(
        userId,
        {
            'avatar': 'http://202.120.38.146:8688/avatars/'+userId+'.jpg'
        }
    );
    ctx.status = 200;
    ctx.body = {};
};
module.exports.securedRouters = {
    'GET /tmpTest':tmpTest,
    'GET /getCollectWords':getCollectWords,
    'POST /whetherInCollectWords':whetherInCollectWords,
    'GET /getWords':getWords,
    'POST /updateSetting':updateSetting,
    'POST /getLevelWord':getLevelWord,
    'GET /totalAnswers/:query':totalAnswers,
    'GET /totalCorrectAnswers/:query':totalCorrectAnswers,
    'GET /totalLearnedWords/:query':totalLearnedWords,
    'GET /totalChapters/:query':totalChapters,
    'GET /totalReadingTime/:query':totalReadingTime,
    'GET /totalReadingBooks/:query':totalReadingBooks,
    'GET /totalReadingWords/:query':totalReadingWords,
    'GET /consecutiveTime':consecutiveRTime,
    'GET /myInfo': myInfo,
    'GET /myComments': getMyComments,
    'POST /updateLevel': updateLevel,
    'POST /updateWords': updateWords,
    'POST /updateCollectWords':updateCollectWords,
    'POST /updateBookProgress': updateBookProgress,
    'POST /user/book': addBook,
    'DEL /user/book': removeBook,
    'DEL /removeCollectWord':removeCollectWord,
    'PUT /user': updateInfo,
    'GET /recommend': getRecommendedBooks,
    'POST /user/record': updateRecord,
    'PUT /user/phone': updatePhone,
    'PUT /user/status': updateStatus,
    'POST /like':likeBook,
    'POST /unlike':unLikeBook,
    'DEL /deleteComments': deleteComments,
    'POST /uploadAvatar': uploadAvatar
};


module.exports.routers = {
    'GET /loginForWechat/:code':loginForWechat,
    'GET /user': list,
    'POST /auth': auth,
    'POST /user': register,
    'POST /authByWechat': authByWechat,
    'POST /authByPhone':authByPhone,
    'POST /updatePassword':updatePassword, 
    'GET /user/:id': getInfoById
};
