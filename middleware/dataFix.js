"use strict";
const BookModel = require("../model/book");
const addImdb =async (ctx)=>{
    const average_ratingVal = 3.64278616819345;
    const m = 10000;
    let booknum = await BookModel.find().count();
    for(let i=0;i<booknum;i+=5){
        let book = await BookModel.find().skip(i).limit(5);
        for(let j=0;j<5;j++){
            let IMDB = book[i].goodreads_ratingVal*(book[i].goodreads_ratings/(book[i].goodreads_ratings+m))+(m/(book[i].goodreads_ratings+m))*average_ratingVal;
            await BookModel.update({"_id":book[i]._id},{$set:{"IMDB":IMDB}});
        }
    }
};
module.exports=addImdb;