'use strict';

const crypto = require('crypto');
const jwt = require('../middleware/jwt')
const UserModel = require('../model/user');
const ERRORCODE = require('../CONSTANTS').ERRORCODE;

const list = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = 10;
    let skip = (page - 1) * limit;
    let users = await UserModel.find().exec();
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
    // TODO: use user token
    let userId = "5ad882e4ac2fba1e3666cd87";
    let user = await UserModel.findById(userId);
    ctx.status = 200;
    ctx.body = user;
}

const updateLevel = async (ctx) => {
    // TODO: use user token
    let userId = "5ad882e4ac2fba1e3666cd87";
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
    let userId = "5ad882e4ac2fba1e3666cd87";
    let user = await UserModel.findById(userId);
    for (var i = 0; i < user.words.length; i++) {
        console.log(user.words[i].word)
        console.log(updateWords)
        if (updateWords.includes(String(user.words[i].word))) {
            console.log('plus one')
            user.words[i].times++;
        }
    }
    user = await user.save();
    ctx.status = 200;
    ctx.body = {};
}

module.exports.securedRouters = {
    // 'GET /user': list
};

module.exports.routers = {
    'GET /user': list,
    'POST /auth': auth,
    'POST /user': register,
    'GET /myInfo': myInfo,
    'POST /updateLevel': updateLevel,
    'POST /updateWords': updateWords
};