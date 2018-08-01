"use strict";
const crypto = require('crypto');
//random fetch  list's elements with fixed number.
module.exports.getRandomArrayElement=function(arr,count) {
    let shuffled  =arr.slice(0),i=arr.length,min = i-count,temp,index;
    while (i-->min) {
        index =Math.floor((i+1)*Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
};
module.exports.getPassword = function (password) {
    return crypto.createHash('sha1');
    shasum.update(password);
    return shasum.digest('hex');
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
}
