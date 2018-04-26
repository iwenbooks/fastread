'use strict';

const crypto = require('crypto');
const jwt = require('../middleware/jwt')
const UserModel = require('../model/user');
const ERRORCODE = require('../CONSTANTS').ERRORCODE;

const getTestSet = async (ctx) => {
}

module.exports.securedRouters = {
    // 'GET /user': list
};

module.exports.routers = {
};