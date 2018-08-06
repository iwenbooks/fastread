'use strict';

const AwardListModel = require('../model/awardList')
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
    let page = Number(ctx.query.page) || 1;
    let limit = Number(ctx.query.limit) || 10;
    let skip = (page - 1) * limit;
    let mylevel = Number(ctx.query.level)||10;
    let award = ctx.query.award;
    try {
        let book = await AwardListModel.find({"name": award})
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

const getAwardList = async(ctx)=>{
    let awardList = await AwardListModel.find().select("name abstract cover").exec();
    ctx.body = awardList;
};

module.exports.securedRouters = {
};

module.exports.routers = {
    'GET /getAward':getAward,
    'POST /awardList': create,
    'GET /getAwardList':getAwardList
};
