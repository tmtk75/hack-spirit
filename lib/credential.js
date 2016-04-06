'use strict';

let keychain = require('keychain');

const StoreType = {
  Keychain : 'keychain'
};

class Credential {
  constructor() {
    this.type = StoreType.Keychain;
  }

  * set(userName, password) {
    return new Promise((resolve, reject) => {
      keychain.setPassword({
        account: 'hack-spirit',
        service: 'hack-spirit.com',
           type: 'internet',
       password: JSON.stringify({ userName: userName, password: password})
      }, (error) => {
        if (error) {
          let message = 'Failed to set your credentials to keychain';
          reject(new Error(message));
        } else {
          resolve();
        }
      });
    });
  }

  * get() {
    return new Promise((resolve, reject) => {
      keychain.getPassword({
        account: 'hack-spirit',
        service: 'hack-spirit.com',
           type: 'internet'
      }, (error, password) => {
        if (error) {
          let message = 'Credentails is not found. Please login first.';
          reject(new Error(message));
        } else {
          resolve(JSON.parse(password));
        }
      });
    });
  }
}

module.exports = Credential;
