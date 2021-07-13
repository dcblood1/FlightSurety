import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

//TODO: everything for server request.
// spin up oracles, register, persist state in memory
// then come up with flight status, and respond back, push transaction to smart contract

// start oracles
// set up oracles
const ORACLES_COUNT = 20;
for(let a=1; a<ORACLES_COUNT; a++) {      
  await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee }); //failing here. Not registering Oracle.
  let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]}); //Failing here.
  console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
}



flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error)
    console.log(event)
});




//not necessary, but if you wanted could build an API for a dropdown box for flights.
const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


