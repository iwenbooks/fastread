'use strict';

const crypto = require('crypto');
const jwt = require('../middleware/jwt')
const UserModel = require('../model/user');
const BookModel = require('../model/book');
const ERRORCODE = require('../CONSTANTS').ERRORCODE;

const list = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = 10;
    let skip = (page - 1) * limit;
    let users = await UserModel.find().skip(skip).limit(limit).exec();
    ctx.body = users;
}

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
}

const register = async (ctx) => {
    let username = ctx.request.body.username;
    let password = ctx.request.body.password;

    let user = new UserModel({
        username: username,
        password: password,
        level: -1
    })
    try {
        let newUser = await user.save();
        ctx.status = 200;
        ctx.body = {};
    } catch (error) {
        ctx.status = 403;
        ctx.body = { "errorCode": ERRORCODE.DUPLICATE_USERNAME }
    }
}

const myInfo = async (ctx) => {
    console.log(ctx)

    let token = jwt.getToken(ctx)
    let userId = token.id;
    let user = await UserModel
        .findById(userId)
        .populate(
            {
                path: 'books.book',
                select: {
                    segments: 0,
                    author: 0
                }
            }
        ).exec();
    ctx.status = 200;
    ctx.body = user;
}

const updateLevel = async (ctx) => {
    // TODO: use user token
    let token = jwt.getToken(ctx)
    let userId = token.id;
    let user = await UserModel.findByIdAndUpdate(
        userId,
        {
            level: ctx.request.body.level
        }
    );
    ctx.status = 200;
    ctx.body = {};
}

const updateWords = async (ctx) => {
    // TODO: use user token
    let updateWords = ctx.request.body.updateWords
    let token = jwt.getToken(ctx)
    let userId = token.id;
    let user = await UserModel.findById(userId);

    updateWords.forEach(word => {
        let isNewWord = true;
        for (var i = 0; i < user.words.length; i++) {
            if (String(user.words[i].word) === word) {
                user.words[i].times++;
                isNewWord = false;
            }
        }
        if (isNewWord) {
            user.words.push({
                word: word,
                times: 1
            })
        }
    });

    user = await user.save();
    ctx.status = 200;
    ctx.body = {};
}

const updateBookProgress = async (ctx) => {
    let updateBook = ctx.request.body.book
    let updateProgress = ctx.request.body.segment
    try {
        let book = await BookModel.findById(updateBook)
        if (book.segments.indexOf(updateProgress.toString()) < 0) {
            ctx.status = 401
            ctx.body = { error: "Invalid segment" }
            return;
        }
        let token = jwt.getToken(ctx)
        let userId = token.id;
        let user = await UserModel.findById(userId);
        for (var i = 0; i < user.books.length; i++) {
            if (String(user.books[i].book) === updateBook) {
                user.books[i].segment = updateProgress
            }
        }
        user = await user.save();
        ctx.status = 200;
        ctx.body = {};
    } catch (error) {
        ctx.status = 401;
        ctx.body = { error: "error" }
    }
}

const addBook = async (ctx) => {
    // TODO: use user token
    let newBookId = ctx.request.body.book
    try {
        let book = await BookModel.findById(newBookId)
        let token = jwt.getToken(ctx)
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
            segment: book.segments[0]
        })
        user = await user.save();
        ctx.status = 200;
        ctx.body = {};
    } catch (error) {
        ctx.status = 401;
        ctx.body = { error: error }
    }
}

const removeBook = async (ctx) => {
    let newBookId = ctx.request.body.book
    try {
        let token = jwt.getToken(ctx)
        let userId = token.id;
        let user = await UserModel.findById(userId)
        for (let i = 0; i < user.books.length; i++) {
            if (String(user.books[i].book) === newBookId) {
                user.books.slice(1, 1)
            }
        }
        user = await user.save();
        ctx.status = 200;
        ctx.body = {};
    } catch (error) {
        ctx.status = 401;
        ctx.body = { error: error }
    }
}

const getRecommendedBooks = async (ctx) => {
    try {
        let token = jwt.getToken(ctx)
        let userId = token.id;
        let user = await UserModel.findById(userId)
        let userBookList = []
        user.books.forEach(book => {
            userBookList.push(book.book)
        }); 
        let books = await BookModel.find({
            level: user.level,
            _id: { "$nin": userBookList }
        }).select({
            segments: 0
        }).sort({
            download: -1
        }).limit(3).exec();
        ctx.body = books;
        ctx.status = 200;
    } catch (error) {
        ctx.status = 401;
        ctx.body = { error: error }
    }
}

module.exports.securedRouters = {
    'GET /myInfo': myInfo,
    'POST /updateLevel': updateLevel,
    'POST /updateWords': updateWords,
    'POST /updateBookProgress': updateBookProgress,
    'POST /user/book': addBook,
    'DEL /user/book': removeBook,
    'GET /user/recommend': getRecommendedBooks
};

module.exports.routers = {
    'GET /user': list,
    'POST /auth': auth,
    'POST /user': register
};