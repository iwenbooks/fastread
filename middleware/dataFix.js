"use strict";
const BookModel = require("../model/book");
const addImdb =async (ctx)=>{
    const average_ratingVal = 3.64278616819345;
    const m = 10000;
    for(let i=0;i<16783;i+=10){
        let book = await BookModel.find().skip(i).limit(5);
        console.log(i);
        for(let j=0;j<10;j++){
            let IMDB = book[j].goodreads_ratingVal*(book[j].goodreads_ratings/(book[j].goodreads_ratings+m))+(m/(book[j].goodreads_ratings+m))*average_ratingVal;
            await BookModel.update({"_id":book[j]._id},{$set:{"IMDB":IMDB}});
        }
    }
};
module.exports=addImdb;