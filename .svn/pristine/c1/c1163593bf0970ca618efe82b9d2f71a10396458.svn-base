'use strict';

const jwt = require('../middleware/jwt')
const SuggestModel = require('../model/suggest')


const userSuggest = async (ctx) => {
    let token = jwt.getToken(ctx)
    let userId = token.id
    let suggest = new SuggestModel({
        'user': userId,
        'content': ctx.request.body.content,
        'source': ctx.query.source
    })
    await suggest.save()
    ctx.status = 200;
    ctx.body = {};
}

module.exports.securedRouters = {
    'POST /suggest/userSuggest': userSuggest,
};
