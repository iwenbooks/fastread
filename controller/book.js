'use strict';

const jwt = require('../middleware/jwt')
const BookModel = require('../model/book');

const list = async (ctx) => {
    let books = await BookModel.find().exec();
    ctx.body = books;
}

const getInfoById = async (ctx) => {
	let bookInfo = await BookModel.findById(ctx.params.id)
		.populate({
			path: 'segments'
		})
        .exec()
    ctx.body = bookInfo
}

const create = async (ctx) => {
    let bookname = ctx.request.body.bookname;
    let author = ctx.request.body.author;
    let segments = ctx.request.body.segments;
    console.log(ctx.request)
    try {
        let book = new BookModel({
            bookname: bookname,
            author: author,
            segments: segments
        }).save()
        ctx.status = 200;
        ctx.body = {};
    } catch (error) {
        ctx.status = 403;
        // TODO: error code
        ctx.body = { "error": "error" }
    }
}

module.exports.securedRouters = {
    // 'GET /users': list
};

module.exports.routers = {
    'GET /book': list,
    'GET /book/:id': getInfoById,
    'POST /book': create
};