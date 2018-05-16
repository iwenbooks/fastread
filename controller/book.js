'use strict';

const jwt = require('../middleware/jwt')
const BookModel = require('../model/book');

const list = async (ctx) => {
    let page = ctx.query.page || 1;
    let limit = 10;
    let skip = (page - 1) * limit;

    let books = await BookModel.find().skip(skip).limit(limit).exec();
    ctx.body = books;
}

const getBookByLevel = async (ctx) => {
    let books = await BookModel.find({
        level: ctx.params.level
    }).select({
        segments: 0 
    }).exec();
    ctx.body = books;
}

const getInfoById = async (ctx) => {
    let bookInfo = await BookModel.findById(ctx.params.id)
        .populate({
            path: 'segments',
            select: {
                content: 0
            }
        })
        .exec()
    ctx.body = bookInfo
}

const create = async (ctx) => {
    let bookModel = ctx.request.body;
    try {
        let book = await new BookModel(bookModel).save()

        ctx.status = 200;
        ctx.body = { _id: book._id };
    } catch (error) {
        ctx.status = 403;
        // TODO: error code
        ctx.body = { "error": "error" }
    }
}

module.exports.securedRouters = {
};

module.exports.routers = {
    'GET /book': list,
    'GET /book/:id': getInfoById,
    'POST /book': create,
    'GET /getBookByLevel/:level': getBookByLevel
};