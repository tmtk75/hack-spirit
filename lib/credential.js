'use strict';

let keychain  = require('keychain');
let crypto    = require("crypto");
let os        = require('os');
let fs        = require('fs');
let mkdirp    = require('mkdirp');
let osHomedir = require('os-homedir');

const StoreType = {
  Keychain: 'keychain',
  File:     'file'
};

const cryptoPassword = 'hack-spirit-credetial';
const algorithm      = 'aes-256-ctr';

class Credential {
  constructor() {
    if (os.type() === 'Darwin') {
      this.type = StoreType.Keychain;
      this.set  = this.setWithKeychain;
      this.get  = this.getWithKeychain;
    } else {
      this.type = StoreType.File;
      this.set  = this.setWithFile;
      this.get  = this.getWithFile;
    }
  }

  setWithKeychain(userName, password) {
    return new Promise((resolve, reject) => {
      keychain.setPassword({
        account:  'hack-spirit',
        service:  'hack-spirit.com',
        type:     'internet',
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

  setWithFile(userName, password) {
    let data = JSON.stringify({ userName: userName, password: password});
    let cipher = crypto.createCipher(algorithm, cryptoPassword);
    var ciphered = cipher.update(data, 'utf8', 'hex');
    ciphered += cipher.final('hex');

    return new Promise((resolve, reject) => {
      let dir = `${osHomedir()}/.hackspirit`;
      mkdirp(dir, () => {
        fs.writeFile(`${dir}/auth`, ciphered, 'utf8', (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    });
  }

  getWithKeychain() {
    return new Promise((resolve, reject) => {
      keychain.getPassword({
        account: 'hack-spirit',
        service: 'hack-spirit.com',
        type:    'internet'
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

  getWithFile() {
    return new Promise((resolve, reject) => {
      let dir = `${osHomedir()}/.hackspirit`;
      fs.readFile(`${dir}/auth`, 'utf8', (error, ciphered) => {
        if (error) {
          let message = 'Credentails is not found. Please login first.';
          reject(new Error(message));
        } else {
          let decipher = crypto.createDecipher(algorithm, cryptoPassword);
          var data = decipher.update(ciphered, 'hex', 'utf8');
          data += decipher.final('utf8');
          resolve(JSON.parse(data));
        }
      });
    });
  }
}

module.exports = Credential;
