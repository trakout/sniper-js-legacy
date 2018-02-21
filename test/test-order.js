const promisify = require('es6-promisify')
const BigNumber = require('bignumber.js')

let chai = require('chai')
let ChaiPromise = require('chai-as-promised')
let ChaiBigNumber = require('chai-bignumber')
const expect = chai.expect
chai.use(ChaiBigNumber())
chai.use(ChaiPromise)


describe('order submission', () => {
  it('should create and sign order', async () => {

  })

  it ('should verify signed order', () => {

  })
})
