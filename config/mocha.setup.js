require('babel-register');
// require('babel-polyfill');
require('isomorphic-fetch');

global.CFG = require('../config').dev;

global.utils = require('web3').utils
global.promisify = require('es6-promisify')
global.BigNumber = require('bignumber.js-5')

global.chai = require('chai')
global.ChaiPromise = require('chai-as-promised')
global.ChaiBigNumber = require('chai-bignumber')
global.expect = chai.expect
global.chai.use(ChaiPromise)
global.chai.use(ChaiBigNumber(BigNumber))

global.ROPSTEN_NET = 'https://ropsten.infura.io/FQ4iNOLxTaxMi70mEmSW'
global.MAIN_NET = 'https://mainnet.infura.io/FQ4iNOLxTaxMi70mEmSW'
