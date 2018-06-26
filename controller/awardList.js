'use strict';

const AwardListModel = require('../model/awardList')

const getAwardListBooks = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = Number(ctx.query.limit) || 10;
    let level = ctx.query.level || 1;

    let awardListInfo = await AwardListModel.findById(ctx.params.id)
        .populate('books', '_id level')
        .exec()
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

module.exports.securedRouters = {
};

module.exports.routers = {
    'GET /awardList/:id/books': getAwardListBooks,
    'POST /awardList': create
};