'use strict';

const jwt = require('../middleware/jwt');
const BookModel = require('../model/book');
const fs = require('fs');
const config = require('../config');
const commonFunction =require("../middleware/common_function");

const list = async ctx => {
  let page = ctx.query.page || 1;
  let limit = Number(ctx.query.limit) || 10;
  let skip = (page - 1) * limit;

  let books = await BookModel.find()
    .skip(skip)
    .limit(limit)
    .exec();
  ctx.body = books;
};

const getBookByLevel = async ctx => {
  let books = await BookModel.find({
    level: ctx.params.level
  })
    .select({
      segments: 0
    })
    .exec();
  ctx.body = books;
};
const getInfoById = async (ctx) => {
    let bookInfo = await BookModel.findById(ctx.params.id)
        .populate({
            path: 'segments',
            select: {
                "content":0,
                "name":0,
                "level":0,
                "words":0,
                "created":0,
                "updated":0,
                "comments":0,
                "commentNum":0
            }
        });
    if(bookInfo==null){
        ctx.status = 404;
        ctx.body = {error:"Invalid bookID"}
        return ;
    }
    console.log(bookInfo);
    let tmp = [];
    for(let i of bookInfo.segments){
        tmp.push(i['_id']);
    }
    bookInfo.segments = tmp;    
    ctx.body = bookInfo;
};

const create = async ctx => {
  let bookModel = ctx.request.body;
  try {
    let book = await new BookModel(bookModel).save();

    ctx.status = 200;
    ctx.body = { _id: book._id };
  } catch (error) {
    ctx.status = 403;
    // TODO: error code
    ctx.body = { error: 'error' };
  }
};

const updateInfo = async ctx => {
  let bookId = ctx.params.book;
  let book = await BookModel.findByIdAndUpdate(bookId, ctx.request.body);
  ctx.status = 200;
  ctx.body = {};
};

const like = async ctx => {
  let book = await BookModel.findById(ctx.request.body.id).exec();
  let token = jwt.getToken(ctx);
  let userId = token.id;
  let alreadyLiked = false;
  for (let i = 0; i < book.likes.length; i++) {
    if (String(book.likes[i]) === userId) {
      alreadyLiked = true;
      book.likes.splice(i, 1);
      break;
    }
  }
  if (!alreadyLiked) {
    book.likes.push(userId);
  }
  book.likeNum = book.likes.length;

  let updatedBook = await book.save();

  ctx.status = 200;
  ctx.body = {};
};

const uploadCover = async ctx => {
  ctx.req.part.pipe(
    fs.createWriteStream(config.cover_path + ctx.params.id + '.jpg')
  );

  ctx.status = 200;
  ctx.body = {};
};
const recommandByLevel = async(ctx)=>{
        let page = ctx.request.body.page || 1;
        let limit = Number(ctx.request.body.limit) || 10;
        let skip = (page - 1) * limit;
        let level = Number( ctx.request.body.level)||10;
        let category=ctx.request.body.category;
        let myCategory={
            1:"Classical Literature",
            2:"Historical Fiction",
            3:"Science Fiction",
            4:"Detective & Mystery",
            5:"Fantasy",
            6:"Romance",
            7:"Children Books",
            8:"Biographies & Memoirs",
            9:"Art",
            10:"Modern Novel",
            11:"Parenting&Families",
            12:"Other"
        };
        let tmp = [myCategory[category]];
        let sortWay = Number(ctx.request.body.sortway)||-1;//default:descending order
        let pattern = ctx.request.body.pattern;
        if(category==0){
            if(pattern=="smart"){
                let tempRes =await BookModel.find({"level":{$lte:level}}).collation({"locale": "en", numericOrdering:true}).sort({"IMDB":sortWay,"cover":-1}).skip(skip).limit(3*limit).exec();
                let num = tempRes.length<limit ? tempRes.length:limit;
                ctx.body = await commonFunction.getRandomArrayElement(tempRes,num);
                return;
            }
            else ctx.body = await BookModel.find({"level":{$lte:level}}).collation({"locale": "en", numericOrdering:true}).sort({[`${pattern}`]:sortWay,"cover":-1}).skip(skip).limit(limit).exec();
            }
        else{
            if(pattern=="smart"){
                let tempRes =await BookModel.find({"level":{$lte:level},"category":{$in:tmp}}).collation({"locale": "en", numericOrdering:true}).sort({"IMDB":sortWay,"cover":-1}).skip(skip).limit(3*limit).exec();
                let num = tempRes.length<limit ? tempRes.length:limit;
                ctx.body = await commonFunction.getRandomArrayElement(tempRes,num);
            }
            else ctx.body = await BookModel.find({"level":{$lte:level},"category":{$in:tmp}}).collation({"locale": "en", numericOrdering:true}).sort({[`${pattern}`]:sortWay,"cover":-1}).skip(skip).limit(limit).exec();
        }
    ctx.status =200;
};



const search = async(ctx)=>{
    let page = ctx.query.page || 1;
    let limit = Number(ctx.query.limit) || 10;
    let skip = (page - 1) * limit;
    let searchQuery = ctx.query.search;
    const queryLength = searchQuery.length;
    let tmpSearchQuery = RegExp("^"+searchQuery)
    let res0=await BookModel.find({"bookname":{$regex:searchQuery,"$options":"i"}}).skip(skip).limit(limit).exec();
    let res1=await BookModel.find({"bookname":{$regex:tmpSearchQuery,"$options":"i"}}).skip(skip).limit(limit).exec();
    let res2 =await BookModel.find({"author":{$regex:tmpSearchQuery,"$options":"i"}}).skip(skip).limit(limit).exec();
    let res3=await BookModel.find({"bookname":{$regex:searchQuery,"$options":"i"}}).skip(skip).limit(limit).exec();
    let res4 =await BookModel.find({"author":{$regex:searchQuery,
    "$options":"i"}}).skip(skip).limit(limit).exec();
    searchQuery=searchQuery.trim().split(/\s+/)
    let res=[];
    res.push(res0);
    res.push(res1);
    res.push(res2);
    res.push(res3);
    res.push(res4);
    for(let item of searchQuery){
        res.push(await BookModel.find({$or:[{"bookname":{$regex:item,"$options":'i'}},{"author":{$regex:item,"$options":'i'}}]}).skip(skip).limit(limit).exec()); 
    }
    let tmp =[];
    let vote = [];
    for(let i = 0 ; i < res.length ; i++){
        for (let j = 0 ; j < res[i].length ;j++){
            let temp = res[i][j]["bookname"];
            let bookNameLength = temp.length;
            let lengthDifference= Math.abs(bookNameLength-queryLength);
            console.log(temp,'\t',lengthDifference);
            if((i<=5)&&(lengthDifference<=5)){
                if(i==0){
                    lengthDifference=-300;
                }
                lengthDifference=-100;
            }else{
                lengthDifference*=5;
            }
            let judge = false;
            for(let k = 0;k<tmp.length; k++){
                if(tmp[k]["bookname"]==temp){
                    vote[k]+=50;
                    judge =true;
                }else{
                    vote[k]-=5;
                }
            }
            if(!judge){
                tmp.push(res[i][j]);
                if(i==0){
                    vote.push(200-lengthDifference);
                }else if(i==1){
                    vote.push(100-lengthDifference);
                }
                else if(i==2){
                    vote.push(50-lengthDifference);
                }
                else if(i==3||i==4){
                    vote.push(10-lengthDifference);
                }
                else{
                    vote.push(5-lengthDifference);
                }
                    
            }
        }        
    }
    let maxIndex;
    for(let i=0;i<vote.length-1;i++){
        maxIndex = i;
        for(let j = i+1;j<vote.length;j++){
            if(vote[j]>vote[maxIndex]){
                maxIndex = j;
            }
        }
        let temp = tmp[i];
        let temp2= vote[i];
        tmp[i]=tmp[maxIndex];
        vote[i]=vote[maxIndex];
        tmp[maxIndex]=temp;
        vote[maxIndex]=temp2;
    }
    ctx.body=tmp;
    ctx.status=200;
}


const GetBookReadingInfo = async(ctx)=>{
    let book = await BookModel.findById(ctx.params.bookid);
    let newlength = book.comments.length;
    await BookModel.update({"_id":ctx.params.bookid},{$set:{"CommentNum":newlength}})
    const result ={
        "likeNum":book.likeNum,
        "numberOfReading":book.numberOfReading,
        "CommentNum":newlength
    };
    ctx.body = result;
    ctx.status=200;
};
const searchByFirstAlphabet=async(ctx)=>{
    let page = Number(ctx.request.body.page);
    let limit = Number(ctx.request.body.limit);
    let skip = limit*(page-1); 
    let query= ctx.request.body.search;
    let pattern = ctx.request.body.pattern;
    let re = RegExp("^"+query);
    console.log(re);
    let book = await BookModel.find({[`${pattern}`]:{$regex:re,$options:"i"}}).sort({"likeNum":-1,"cover":-1,"commentary":-1}).skip(skip).limit(limit).exec();
    ctx.body = book;
    ctx.status = 200;
 };


module.exports.securedRouters = {
    'POST /book/like': like
};

module.exports.routers = {
    'POST /searchByFirstAlphabet':searchByFirstAlphabet,
    'GET /GetBookReadingInfo/:bookid':GetBookReadingInfo,
    'POST /recommandByLevel':recommandByLevel,
    'GET /book': list,
    'GET /book/:id': getInfoById,
    'POST /book': create,
    'GET /getBookByLevel/:level': getBookByLevel,
    'PUT /book/:book': updateInfo,
    'GET /search':search,
    'POST /uploadCover/:id': uploadCover
};
