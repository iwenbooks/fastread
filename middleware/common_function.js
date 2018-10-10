"use strict";
const crypto = require('crypto');
//random fetch  list's elements with fixed number.
const getRandomArrayElement=function(arr,count) {
    let shuffled  =arr.slice(0),i=arr.length,min = i-count,temp,index;
    while (i-->min) {
        index =Math.floor((i+1)*Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
};
const getPassword = function (password) {
    return crypto.createHash('sha1');
    shasum.update(password);
    return shasum.digest('hex');
};

const parseJSON=(content)=>{
    let dataString=JSON.stringify(content);
    return JSON.parse(dataString);
};
module.exports={
    getRandomArrayElement,
    getPassword,
    parseJSON
};