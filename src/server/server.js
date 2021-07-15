import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import "babel-polyfill";


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress); 
let firstAirline;
var oracles=[];
let airlines;

//TODO: everything for server request.
// spin up oracles, register, persist state in memory
// then come up with flight status, and respond back, push transaction to smart contract

// start oracles - check
// set up oracles - check
// register oracles - check
// get indexes - check
// register airline - check? should already be registered
// fund airline - check
// register flight
// is flight registered
// change flight status
// passenger buy?? guess no need to right now.

//submit oracle response
//   by watching for oracle request... 


//once registered...
// need to 
//ya TO. 
// lets go over entire thing... just like oracles.js



(async() => {
  let accounts = await web3.eth.getAccounts(); //ganache is 0-24 accounts

  firstAirline = accounts[0];
  
  // authorize app to call data contract
  try{
    await flightSuretyData.methods.authorizeCaller(flightSuretyApp._address).send({from: firstAirline});
  } catch(e){
    console.log("Cannot authorize App contract");
  }

  // fee for registering oracle
  let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call(); //1 ether
  console.log('This is the fee: ' + fee);

  // fee for registering airline
  let airlineFee = await flightSuretyApp.methods.AirlineRegistrationFee().call(); //10 ether
   console.log('airlinefee' + airlineFee);
   console.log('fee' + fee);

   let OracleAccounts = accounts.splice(10,24); //14 oracles for now... until ganache update
   airlines = accounts.splice(1,3); //0, 1-3 airlines

   console.log('airlines: '+ airlines);
   console.log('oracleAccounts' + OracleAccounts);


   //register airline
    // just need to call fund for the first one and thats fine for now

   try{
     await flightSuretyData.methods.fund(firstAirline).send({from: firstAirline, value: airlineFee});
     console.log('fund first airline');
   } catch(e) {
     console.log('cannot register airline');
     console.log(e);
   }

   //register oracles
   console.log('starting to register oracles')
   for(let a=0; a<OracleAccounts.length; a++) {
    try {
      await flightSuretyApp.methods.registerOracle().send({
        from: OracleAccounts[a], 
        value:fee,
        gas: 4712388,
        gasPrice: 100000000000
      });
      console.log('registered oracle');

      // get indexes for each oracle
      let index = await flightSuretyApp.methods.getMyIndexes().call({from: OracleAccounts[a]});
      oracles.push({address: OracleAccounts[a],
                    index: index
                  })
    } catch(e) {
      console.log("cannot register oracles");
      console.log(e);
    }
  } //end for 
    console.log('end of async');
})(); // end async

console.log('meow');

const ORACLES_COUNT = 20;
//for(let a=1; a<ORACLES_COUNT; a++) {      
//  await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee }); //failing here. Not registering Oracle.
//  let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]}); //Failing here.
//  console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
//}



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


