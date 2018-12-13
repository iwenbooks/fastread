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
const getRandomElement=function(arr) {
    let index =Math.floor((arr.length)*Math.random());
    return arr[index];
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
const getEuclideanDistance =(listA,listB)=>{
    let x=0,y=0;
    listA.forEach(
        (value,index,err)=>{
            if(listB.indexOf(value)==-1)
                x++;
        }
    );
    listB.forEach(
        (value,index,err)=>{
            if(listA.indexOf(value)==-1)
                y++;
        }
    );
    return (x*x+y*y)**(1/2);
};
module.exports={
    getRandomArrayElement,
    getPassword,
    getEuclideanDistance,
    parseJSON,
    getRandomElement
};
