'use strict';
const AuthorModel = require('../model/author');
const create = async (ctx) => {
    let authorModel = ctx.request.body;
    try {
        let author = await new AuthorModel(authorModel).save()
        ctx.status = 200;
        ctx.body = { _id: author._id };
    } catch (error) {
        ctx.status = 403;
        // TODO: error code
        ctx.body = { "error": "error" }
    }
}
const getAuthorBooks = async(ctx)=>{
    let page = Number(ctx.query.page) || 1;
    let limit = Number(ctx.query.limit) || 10;
    let skip = (page - 1) * limit;
    let mylevel = Number(ctx.query.level)||10;
    let author = ctx.query.author;
    try {
        let book = await AuthorModel.find({"name": author})
            .populate(
                {
                    path: 'books',
                    select: {
                        "_id": 1,
                        "cover": 1,
                        "author": 1,
                        "bookname": 1,
                        "commentary": 1,
                        "category": 1
                    },
                    match: {"level": {$lte: mylevel}},
                    options:{
                        limit:limit,
                        skip:skip
                    }
                }
            ).exec();
        if(book.length<1)
            ctx.body = [];
        else {

            let result= book[0]["books"].sort();
            ctx.body =result;
            ctx.status = 200;
        }
    }
    catch (err) {
        ctx.status=401;
        ctx.body ={
            error:"error"
        }

    }
};

module.exports.securedRouters = {
};

module.exports.routers = {
    'GET /getAuthorBooks':getAuthorBooks
};
