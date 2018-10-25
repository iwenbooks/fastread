'use strict';

const jwt = require('../middleware/jwt');
const BookModel = require('../model/book');
const UserModel = require('../model/user');
const fs = require('fs');
const config = require('../config');
const commonFunction =require("../middleware/common_function");
const CategoryInfo = require('../CONSTANTS').CategoryInfo;

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
        let myCategory=CategoryInfo;
        let tmp = [myCategory[category]];
        let sortWay = Number(ctx.request.body.sortway)||-1;//default:descending order
        let pattern = ctx.request.body.pattern;
        if(category==0){
            if(pattern=="smart"){
                let tempRes =await BookModel.find({"level":{$lte:level}},{"_id":1,"bookname":1,"author":1,"cover":1}).collation({"locale": "en", numericOrdering:true}).sort({"IMDB":sortWay,"cover":-1}).skip(skip).limit(3*limit).exec();
                let num = tempRes.length<limit ? tempRes.length:limit;
                ctx.body = await commonFunction.getRandomArrayElement(tempRes,num);
                return;
            }
            else ctx.body = await BookModel.find({"level":{$lte:level}},{"_id":1,"bookname":1,"author":1,"cover":1}).collation({"locale": "en", numericOrdering:true}).sort({[`${pattern}`]:sortWay,"cover":-1}).skip(skip).limit(limit).exec();
            }
        else{
            if(pattern=="smart"){
                let tempRes =await BookModel.find({"level":{$lte:level},"category":{$in:tmp}},{"_id":1,"bookname":1,"author":1,"cover":1}).collation({"locale": "en", numericOrdering:true}).sort({"IMDB":sortWay,"cover":-1}).skip(skip*3).limit(3*limit).exec();
                let num = tempRes.length<limit ? tempRes.length:limit;
                ctx.body = await commonFunction.getRandomArrayElement(tempRes,num);
            }
            else ctx.body = await BookModel.find({"level":{$lte:level},"category":{$in:tmp}},{"_id":1,"bookname":1,"author":1,"cover":1}).collation({"locale": "en", numericOrdering:true}).sort({[`${pattern}`]:sortWay,"cover":-1}).skip(skip).limit(limit).exec();
        }
    ctx.status =200;
};

//const search = async(ctx)=>{
//	let searchQuery = ctx.query.search;
//	let limit = Number(ctx.query.limit) || 10;
//    let skip = (page - 1) * limit;
//	let res=await BookModel.find({$or:[{"bookname":{$regex:searchQuery,"$options":"i"}},
//	{"author":{$regex:searchQuery,"$options":"i"}}]}).skip(skip).limit(limit).exec();
//	ctx.body=res;
//    ctx.status=200;
//}
function maxSubStr(a,b)
{
	a=a.toLowerCase();
	b=b.toLowerCase();
	let len1 = a.length;
    let len2 = b.length;
    let result = 0;     //记录最长公共子串长度
    //int c[][] = new int[len1+1][len2+1];
	let c=[];
	for(let i=0;i<=len1;i++)
	{
		let tempc=[];
		for(let j=0;j<=len2;j++)
			tempc.push(0);
		c.push(tempc);
	}
			
    for (let i = 0; i <= len1; i++) 
	{
        for( let j = 0; j <= len2; j++) 
		{
            if(i == 0 || j == 0) 
			{
                c[i][j] = 0;
            } 
			else if (a[i-1] == b[j-1]) 
			{
                c[i][j] = c[i-1][j-1] + 1;
                result = Math.max(c[i][j], result);
            } else 
			{
                c[i][j] = 0;
            }
        }
    }
    return result;
}
function editDist(a,b)
{
	a=a.toLowerCase();
	b=b.toLowerCase();
	let lena=a.length;
	let lenb=b.length;
	let dp=[]
    for(let j=0; j<=lenb; j++) 
		dp.push(j);
    let t1=0;
	let t2=0;
    for(let i=1; i<=lena; i++) 
	{
        t1 = dp[0]++;
        for(let j=1; j<=lenb; j++) 
		{
            t2 = dp[j];
            if(a[i-1]==b[j-1])
                dp[j] = t1;
            else
                dp[j] = Math.min(t1, Math.min(dp[j-1], dp[j]))+1;
            t1 = t2;
        }
    }
   // printf("%d\n", dp[lenb]);
	return dp[lenb];
}

const search = async(ctx)=>{
	let catg=new Array("","Classical Literature","Historical Fiction","Science Fiction","Romance","Detective & Mystery","Children Books","Biographies & Memoirs","Art","Modern Novel","Non Fiction","Parenting & Families","Short Books","Other");
    let page = ctx.query.page || 1;
	//let page=10
    let limit = (Number(ctx.query.limit) || 10)*20;
    let skip = (page - 1) * limit;
    let searchQuery = " "+ctx.query.search+" ";
	let category=  Number(ctx.query.category)||0;
    const queryLength = searchQuery.length;
    let tmpSearchQuery = RegExp("^"+searchQuery);
	let res0=[];
	let res1=[]
	//console.log("category:",category)
	//console.log("limi:",limit)
	//console.log("page:",page)
	let res=[];
	
	if (category==0){
		res0=await BookModel.find({$or:[{"bookname":{$regex:searchQuery,"$options":"i"}},
	{"author":{$regex:searchQuery,"$options":"i"}}]}).skip(skip).limit(limit).exec();
		//res1=await BookModel.find({$text: {$search:searchQuery}},{score: {$meta: "textScore"}}).sort({score:{$meta:"textScore"}}).skip(skip).limit(limit).exec();
		res1=await BookModel.find({$text: {$search:searchQuery}}).skip(skip).limit(limit).exec();
	}
	else 
	{
		res0=await BookModel.find({$or:[{$and:[{"bookname":{$regex:searchQuery,"$options":"i"}},{"category":catg[category]}]},
{$and:[{"author":{$regex:searchQuery,"$options":"i"}},{"category":catg[category]}]}]}).skip(skip).limit(limit).exec();
		res1=await BookModel.find({$and:[{$text: {$search:searchQuery}},{"category":catg[category]}]}, {score: {$meta: "textScore"}}).sort({score:{$meta:"textScore"}}).skip(skip).limit(limit).exec();
	
	}
	//let res=[];
	console.log("res0:",res0.length,"dssa")
	let resTag=0;
	if(res0.length!=0)
	{
	    res.push(res0);
		resTag=1;
	}
	if(res1.length!=0)
	{
		res.push(res1);
		resTag=1;
	}
	console.log("resssss:",res.length,":resend")
	let resTest=await BookModel.find({$text: {$search:searchQuery}}).skip(skip).limit(1).exec();
	if(resTag==0&&resTest.length<=5)
	{
		
		for(let t=1;t<queryLength;t++)
		{
			let newsq=searchQuery.substring(0,t)+" "+searchQuery.substring(t,queryLength);
			if (category==0)
			{
				res1=await BookModel.find({$text: {$search:newsq}}).skip(skip).limit(limit*5).exec();
			}
			else 
			{
				res1=await BookModel.find({$and:[{$text: {$search:newsq}},{"category":catg[category]}]}, {score: {$meta: "textScore"}}).sort({score:{$meta:"textScore"}}).skip(skip).limit(limit*5).exec();
			}
			res.push(res1);
		}
		
	}
	let tmp =[];
    let vote = [];
    for(let i = 0 ; i < res.length ; i++)
	{
        for (let j = 0 ; j < res[i].length ;j++)
		{
            let tempBook = res[i][j]["bookname"];
			let tempAuthor=res[i][j]["author"];
			let sqstr=searchQuery.split(' ');  
			let sqstrLen=sqstr.length;
			let maxSubstrLen=0;
			let editLength=0;
			if(sqstrLen>1)
			{
				for(let t=0;t<sqstrLen;t++)
				{
					maxSubstrLen= maxSubstrLen+Math.max(maxSubStr(tempBook,sqstr[t]),maxSubStr(tempAuthor,sqstr[t]));
				}
			}
			else
				maxSubstrLen= Math.max(maxSubStr(tempBook,searchQuery),maxSubStr(tempAuthor,searchQuery));
			editLength=Math.min(editDist(tempBook,searchQuery),editDist(tempAuthor,searchQuery));
			let score=1.0/editLength+maxSubstrLen;
            
			if(score>2.2)
			{
				let judge = false;
				for(let k = 0;k<tmp.length; k++)
				{
					if(tmp[k]["bookname"]==tempBook)
					{
						//vote[k]+=50;
						judge =true;
						break;
					}
				}
				if(!judge){
					tmp.push(res[i][j]);
					vote.push(score);
				}
			}
        }        
    }
    let maxIndex;
	let voteLen=vote.length;
	for(let i=0;i<voteLen;i++)
	{
		for(let j=i+1;j<voteLen;j++)
		{
			if (vote[i]<vote[j])
			{
				let vtTemp=vote[i];
				vote[i]=vote[j];
				vote[j]=vtTemp;
				let tmtmp=tmp[i];
				tmp[i]=tmp[j];
				tmp[j]=tmtmp;
			}	
		}	
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
const searchByFirstAlphabetOfAuthor=async(ctx)=>{
    let page = Number(ctx.request.body.page);
    let limit = Number(ctx.request.body.limit);
    let skip = limit*(page-1); 
    let query= ctx.request.body.search;
    let re = RegExp("^"+query);
    let book = await BookModel.find({"author":{$regex:re,$options:"i"}},{"author":1}).sort({"IMDB":-1,"likeNum":-1,"cover":-1,"commentary":-1}).skip(skip).limit(limit).exec();
    let result = [];
    for(let i = 0 ; i<book.length;i++) {
        result.push(book[i].author);
    }
    ctx.body = result;
    ctx.status = 200;
};
const searchByAuthor = async(ctx)=>{
    let page = Number(ctx.request.body.page);
    let limit = Number(ctx.request.body.limit);
    let skip = limit*(page-1);
    let author = ctx.request.body.author;
    let book = await BookModel.find({"author":author}).sort({"IMDB":-1,"likeNum":-1,"cover":-1,"commentary":-1}).skip(skip).limit(limit).exec();
    ctx.body = book;
    ctx.status = 200;

};
const checkUpdate = async(ctx)=>{
    try {
        let segmentId = ctx.request.body.segment;
        let book = await BookModel.findById(ctx.request.body.book);
        let firstSegmentId = book["segments"][0];
        if (segmentId == firstSegmentId){
            ctx.body = true;
        } else {
            ctx.body = false;
        }
        ctx.status = 200;
    }
    catch {
        ctx.status = 401;
    }
};
const recommandBook = async(ctx)=>{
    let token = jwt.getToken(ctx);
    let userId = token.id;
    let user =await UserModel.find({"_id":userId}).exec();
    let result =[];
    result.push([[],1000000]);
    let myBook=[];
    let myBookList = user[0]['books'];
    let level = user[0]['level'];
    for(let i =0;i<myBookList.length;i++){
        myBook.push(myBookList[i]['book']);
    }
    let userList = await UserModel.find({"level":{$lte:level+1}},{"books":1}).exec();
    for(let i=0;i<userList.length;i++){
        let tempBooks=userList[i]['books'];
        let tempBookList=[];
        tempBooks.forEach(
            (value,index,err)=>{
                tempBookList.push(value['book']);
            }
        );
        let weight = commonFunction.getEuclideanDistance(myBook,tempBookList);
        let temp = [tempBookList,weight];
        for(let j=0;j<result.length;j++){
            if(weight<=result[j][1]&&weight>=1){
                result.splice(j,0,temp);
            }
        }
    }

    let finialBook=[];
    for(let i=0;i<result.length-1;i++){
        let bookList = result[i][0];
        for(let j=0;j<bookList.length;j++){
            if(finialBook.indexOf(bookList[j]==-1&&myBook.indexOf(bookList[j]==-1)){
                finialBook.push(bookList[i]);
            }
        }
    }
    console.log(finialBook);








};
module.exports.securedRouters = {
    'POST /book/like': like,
    'GET /recommandBook':recommandBook
};

module.exports.routers = {
    'POST /searchByAuthor':searchByAuthor,
    'POST /searchByFirstAlphabetOfAuthor':searchByFirstAlphabetOfAuthor,
    'GET /GetBookReadingInfo/:bookid':GetBookReadingInfo,
    'POST /recommandByLevel':recommandByLevel,
    'GET /book': list,
    'GET /book/:id': getInfoById,
    'POST /book': create,
    'GET /getBookByLevel/:level': getBookByLevel,
    'PUT /book/:book': updateInfo,
    'GET /search':search,
    'POST /uploadCover/:id': uploadCover,
    'POST /checkUpdate': checkUpdate
};
