# SniperJS

[![Build Status](https://travis-ci.org/sniper-exchange/sniper-js.svg?branch=master)](https://travis-ci.org/sniper-exchange/sniper-js)
[![npm version](https://badge.fury.io/js/sniper-js.svg)](https://badge.fury.io/js/sniper-js)
[![codecov](https://codecov.io/gh/sniper-exchange/sniper-js/branch/master/graph/badge.svg)](https://codecov.io/gh/sniper-exchange/sniper-js)
[![NSP Status](https://nodesecurity.io/orgs/sniper-exchange/projects/34350ea9-5bcc-455c-9d28-2f807e738fba/badge)](https://nodesecurity.io/orgs/sniper-exchange/projects/34350ea9-5bcc-455c-9d28-2f807e738fba)




### Overview
SniperJS is a javascript library that assists in the of development third-party applications for [sniper.io](https://www.sniper.io/). SniperJS ships as both ECMAScript 6 and CommonJS modules -- it can run in-browser or in NodeJS. This module aims to provide reusable code in support of a range of applications, from frontends to bots.


### Module Installation
- `npm i --save sniper-js`


### Quickstart
```
import Sniper from 'sniper-js'

// requires web3 Provider
let snpr = new Sniper({
  provider: web3 // can be injected web3 object, or rpc URL string
})

// create an order
snpr.init().then(() => {
  // orderObj contains order data
  snpr.createOrderAsync(orderObj)
  .then((order) => {
    let hash = snpr.getOrderHash(order)

    // verify order signature
    console.log(
      'verification test:',
      snpr.verifySignature(hash, order.maker, order.sig)
    )

    return order
  }).then((order) => {
    // submit order
    snpr.submitOrder(order)
  })
})
```


### Local Installation
- Requires NodeJS & NPM
- `npm i`

#### Test
- `npm test`

#### Develop
- `npm start`

#### Standalone Build
- `npm run build`
