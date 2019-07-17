const request = require('request');

const Config = require('../config/config').getProps();

const host = `${Config.accounts.app.host  }:${  Config.accounts.app.port}`;

const createAccount = (password) => {
  return new Promise((resolve, reject) => {
    const options = {
      url : `${host  }/account/new`,
      method : 'POST',
      json: true,
      body: {password},
    };
    request(options, (err, res, bodyDetails) => {
      if(err)
        reject(err);
      resolve(bodyDetails);
    });
  });
};

const unlockAccount = body => {
  return new Promise((resolve, reject) => {
    const options = {
      url : `${host  }/accounts/unlock`,
      method : 'POST',
      json: true,
      body,
    };
    request(options, (err, res, bodyDetails) => {
      if(err)
        return reject(err);
      if(bodyDetails.statusCode !== 200){
        return reject(new Error(bodyDetails.err.message));
      }
      return resolve(body);
    });
  });
};

module.exports = {
  createAccount,
  unlockAccount,
};
