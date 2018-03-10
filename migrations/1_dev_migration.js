const cfg = require('../truffle').networks.development.cfg;

// Main Contracts
let TestToken                       = artifacts.require('TestToken.sol');
let EtherToken                      = artifacts.require('EtherToken.sol');
// let SniperTokenDistribution         = artifacts.require('SniperTokenDistribution.sol');
// let SniperTokenDistributionTime     = artifacts.require('SniperTokenDistributionTime.sol');
// let SniperTokenDistributionAmount   = artifacts.require('SniperTokenDistributionAmount.sol');
// let SniperTokenDistributionFinished = artifacts.require('SniperTokenDistributionFinished.sol');
// let TokenTransferProxy              = artifacts.require('TokenTransferProxy.sol');
// let SniperExchange                  = artifacts.require('SniperExchange.sol');


/* Contract/library dependancy heirarchy is as follows:
- SniperTokenDistribution
  - SniperToken
    - Ownable
    - StandardToken
      - BasicToken
        - ERC20Basic
        - SafeMath
      - ERC20
        - ERC20Basic

- SniperExchange
  - SafeMath
  - StandardToken
    - BasicToken
      - ERC20Basic
      - SafeMath
  - TokenTransferProxy
    - Ownable
    - StandardToken
      - BasicToken
        - ERC20Basic
        - SafeMath
*/


// Unix Timestamp Helper
Date.prototype.getUnixTime = function() { return this.getTime() / 1000 | 0 }
if (!Date.now) Date.now = function() { return new Date() }
Date.time = function() { return Date.now().getUnixTime() }

// Add Days to Date
Date.prototype.addDays = function(days) {
  var dat = new Date(this.valueOf())
  dat.setDate(dat.getDate() + days)
  return dat
}

// Add Seconds to Date
Date.prototype.addSeconds = function(seconds) {
  var dat = new Date(this.valueOf())
  dat.setSeconds(dat.getSeconds() + seconds)
  return dat
}


module.exports = (deployer, network, accounts) => {

  if (!(network == 'development' || network == 'develop' || network == 'ropsten')) return

  if (!cfg) {
    console.error('Config unavailable, exiting!')
    return
  }

  // var
  const adminAddress = cfg.adminAddress ? cfg.adminAddress : accounts[0]
  const distroInterval = cfg.distroInterval // tokens are distributed over 90 days total
  const presaleInterval = cfg.presaleInterval // presale length in days
  const totalSupply = web3.toWei(cfg.totalSupply, 'ether')
  const premintAmount = web3.toWei(cfg.premintAmount, 'ether')
  const presaleAmount = web3.toWei(cfg.presaleAmount, 'ether')

  let distRates = cfg.distRates

  let startDate = new Date(cfg.startDate)
  let endDate = startDate.addDays(distroInterval).getUnixTime()
  let presaleTimeLen = presaleInterval * 24 * 60 * 60
  let presaleEndDate = startDate.addDays(presaleInterval).getUnixTime()
  startDate = startDate.getUnixTime()

  // faux/emulated intervals
  // starts from time of deployment,
  // total distribution period is 5min, presale is 1min,
  // therefore each phase should be 1min
  const distroIntervalEmu = cfg.emuDistroInterval
  const presaleIntervalEmu = cfg.emuPresaleInterval
  let startDateEmu = new Date()

  let endDateEarly = startDateEmu.addSeconds(0.1).getUnixTime()
  let presaleTimeLenEarly = 0.1

  let endDateEmu = startDateEmu.addSeconds(distroIntervalEmu).getUnixTime()
  let presaleTimeLenEmu = presaleIntervalEmu
  let presaleEndDateEmu = startDateEmu.addSeconds(presaleIntervalEmu).getUnixTime()
  startDateEmu = startDateEmu.getUnixTime()


  // TestToken
  deployer.deploy(
    TestToken,
    'Test Token',
    'TST',
    '18',
    web3.toWei('100000000', 'ether')
  ).then(() => {
    console.log('TestToken addr:', TestToken.address)
  })

  // EtherToken
  deployer.deploy(EtherToken).then(() => {
    console.log('EtherToken addr:', EtherToken.address)
  })

  // TokenTransferProxy
  // deployer.deploy(TokenTransferProxy);


  // SniperTokenDistribution
  // deployer.deploy(
  //   SniperTokenDistribution,
  //   adminAddress,
  //   distRates,
  //   totalSupply,
  //   premintAmount,
  //   presaleAmount,
  //   startDate,
  //   endDate,
  //   presaleTimeLen
  // )
  // .then(() => {
  //   console.log('SniperTokenDistribution addr:', SniperTokenDistribution.address)
  //   // deployer.deploy(SniperExchange);
  //   // TODO: get address of SniperTokenDistribution, it needs to pass as a param to SniperExchange
  // })
  //
  // SniperTokenDistribution.deployed().then( async (tokenInstance) => {
  //   TokenTransferProxy.deployed().then( async (proxyInstance) => {
  //     const tokenAddr = await tokenInstance.token.call()
  //     const proxyAddr = await proxyInstance.address
  //     deployer.deploy(
  //       SniperExchange,
  //       tokenAddr,
  //       proxyAddr
  //     ).then(() => {
  //       console.log('SniperExchange addr:', SniperExchange.address)
  //     })
  //   })
  // })


  // development ONLY, for testing purposes
  // deployer.deploy(
  //   SniperTokenDistributionTime,
  //   adminAddress,
  //   distRates,
  //   totalSupply,
  //   premintAmount,
  //   presaleAmount,
  //   startDateEmu,
  //   endDateEmu,
  //   presaleTimeLenEmu
  // )
  // .then(() => {
  //   console.log(
  //     'SniperTokenDistributionTime addr:',
  //     SniperTokenDistributionTime.address
  //   )
  // })
  //
  // deployer.deploy(
  //   SniperTokenDistributionAmount,
  //   adminAddress,
  //   distRates,
  //   totalSupply,
  //   premintAmount,
  //   presaleAmount,
  //   startDateEmu,
  //   endDateEmu,
  //   presaleTimeLenEmu
  // )
  // .then(() => {
  //   console.log(
  //     'SniperTokenDistributionAmount addr:',
  //     SniperTokenDistributionAmount.address
  //   )
  // })
  //
  // deployer.deploy(
  //   SniperTokenDistributionFinished,
  //   adminAddress,
  //   distRates,
  //   totalSupply,
  //   premintAmount,
  //   presaleAmount,
  //   startDateEmu,
  //   endDateEarly,
  //   presaleTimeLenEarly
  // )
  // .then(() => {
  //   console.log(
  //     'SniperTokenDistributionFinished addr:',
  //     SniperTokenDistributionFinished.address
  //   )
  // })


  console.info('\n\n==========\nSniper Token Presale Dates:\n' +
    new Date(startDate * 1000) + ' - ' +
    new Date(presaleEndDate * 1000) + '\n' +
    '( ' + startDate + ' - ' + presaleEndDate + ' )'
  )

  console.info('\nSniper Token Phase Distribution Dates:\n' +
    new Date(presaleEndDate * 1000) + ' - ' +
    new Date(endDate * 1000) + '\n' +
    '( ' + startDate + ' - ' + endDate + ' )\n==========\n'
  )

  console.info('==========\nSimulated Sniper Token Presale Dates:\n' +
    new Date(startDateEmu * 1000) + ' - ' +
    new Date(presaleEndDateEmu * 1000) + '\n' +
    '( ' + startDateEmu + ' - ' + presaleEndDateEmu + ' )'
  )

  console.info('\nSimulated Sniper Token Phase Distribution Dates:\n' +
    new Date(presaleEndDateEmu * 1000) + ' - ' +
    new Date(endDateEmu * 1000) + '\n' +
    '( ' + startDateEmu + ' - ' + endDateEmu + ' )\n==========\n\n'
  )
}
