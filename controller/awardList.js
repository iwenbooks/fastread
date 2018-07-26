'use strict';

const AwardListModel = require('../model/awardList')

const getAwardListBooks = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = Number(ctx.query.limit) || 10;
    let level = ctx.query.level || 1;
    let awardListInfo = await AwardListModel.findById(ctx.params.id)
        .populate('books', '_id level')
        .exec();
    let books = awardListInfo.books.filter(
        each => each.level == level
    )
    books = books.slice((page - 1) * limit, page * limit)
    ctx.body = books;
}

const create = async (ctx) => {
    let awardListModel = ctx.request.body;
    try {
        let awardList = await new AwardListModel(awardListModel).save()
        ctx.status = 200;
        ctx.body = { _id: awardList._id };
    } catch (error) {
        ctx.status = 403;
        // TODO: error code
        ctx.body = { "error": "error" }
    }
}
const getAward = async(ctx)=>{
    let page = ctx.query.page || 1;
    let limit = Number(ctx.query.limit) || 10;
    let skip = (page - 1) * limit;
    let mylevel = Number(ctx.query.level)||10;
    let award = ctx.query.award;
    console.log(award);
    let book = await AwardListModel.find({"name":award})
        .populate(
            {
                path:'books',
                select:{
                    "_id":1,
                    "cover":1,
                    "author":1,
                    "bookname":1,
                    "commentary":1
                }
            }
        )
        .sort({"books.bookname":-1}).
        skip(skip).
        limit(limit).exec();
    console.log(book.books);
    ctx.body = book;
    ctx.status=200;
}

module.exports.securedRouters = {
};

module.exports.routers = {
    'GET /getAward':getAward,
    'GET /awardList/:id/books': getAwardListBooks,
    'POST /awardList': create
};
