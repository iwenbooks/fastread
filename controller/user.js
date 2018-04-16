'use strict';

const jwt = require('../middleware/jwt')
const UserModel = require('../model/user');

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
    if (username === "user" && password === "pwd") {
        ctx.body = {
            token: jwt.issue({
                user: "user"
            })
        }
    } else {
        ctx.status = 401;
        ctx.body = { error: "Invalid login" }
    }
}

module.exports.securedRouters = {
    'GET /users': list
};

module.exports.routers = {
    'POST /auth': auth
};