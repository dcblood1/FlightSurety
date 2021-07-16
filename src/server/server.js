import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import "babel-polyfill";
import { Random } from "random-js";

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress); 
let firstAirline;
var oracles=[];
let airlines;
const random = new Random();

//TODO: everything for server request.
// spin up oracles, register, persist state in memory
// then come up with flight status, and respond back, push transaction to smart contract

// start oracles - check
// set up oracles - check
// register oracles - check
// get indexes - check
// register airline - check? should already be registered
// fund airline - check
// register flight - registered one flight
// is flight registered - yes
// change flight status - ?? not sure if this changed or not

//submit oracle response
//   by watching for oracle request... 

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


   //fund first airline
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
    
  //register flight
  try{
    await flightSuretyApp.methods.registerFlight(firstAirline, '010490', 631432800).send({from:firstAirline});
    await flightSuretyApp.methods.registerFlight(firstAirline, '101191', 687157200).send({from:firstAirline});  
  } catch(e) {
    console.log(e);
    console.log('could not register flight / already registered');
  }

  //check if flight is registered

  try{
    let result1 = await flightSuretyApp.methods.isFlightRegistered(firstAirline, '010490', 631432800).call({from:firstAirline}); //check if registerd
    console.log('flight is registered? ---> ' + JSON.stringify(result1));
  } catch(e) {
    console.log(e);
    console.log('flight is not registered / could not be checked');
  }

  // check flight status
  let flightStatus = await flightSuretyApp.methods.viewFlightStatus(firstAirline, '010490', 631432800).call();
  console.log('original flight status: ' + flightStatus);
    
  //change flight status to 20 - one that credits insurees.
  try{
    await flightSuretyApp.methods.changeFlightStatus(firstAirline, '010490', 631432800, 20).send({from: firstAirline});
  } catch(e) {
    console.log(e);
    console.log('could not change flight status / already changed');
  }

  // check flight status
  let flightStatus2 = await flightSuretyApp.methods.viewFlightStatus(firstAirline, '010490', 631432800).call();
  console.log('Updated flight status: ' + flightStatus2);
  
  console.log('end of async');
})(); // end async

console.log('meow');

//this creates a random status, but I want the real one.
function randomStatus(){
  const random = new Random(); 
    return (Math.ceil((random.integer(1, 50)) / 10) * 10); //looks through all possible iterations of flight statuses
}

//this is the big whammy watches for OracleRequest -> this is the combination / merge between the blockchain and our contracts

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) {
      console.log(error);
    } else {
      console.log(event)

      //all relevant code here for submitting oracle response
      let randomStatusCode = 20;//randomStatus();
      console.log(randomStatusCode);
      let eventValue = event.returnValues; //returns event values for OracleRequest
      console.log(eventValue);
      console.log(`Catch a new event with random index: ${eventValue.index} for flight: ${eventValue.flight} and timestamp ${eventValue.timestamp}`);

      //iterate through oracles
      // whatever
      oracles.forEach((oracle) => {
        flightSuretyApp.methods.submitOracleResponse(
          eventValue.index, eventValue.airline, eventValue.flight, eventValue.timestamp, randomStatusCode)
          .send(
            { from:oracle.address,
              gas: 4712388,
              gasPrice: 100000000000 
          }).then(res => {
            console.log(`--> Oracles(${oracle.address}) accepted with status code ${randomStatusCode}`)
          }).catch(err => {
            console.log(`--> Oracles(${oracle.address}) rejected with status code ${randomStatusCode}`)
          });

      }) 
    }
});




//not necessary, but if you wanted could build an API for a dropdown box for flights.
const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


