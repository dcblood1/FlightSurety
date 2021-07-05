
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    dataAddress = await config.flightSuretyData.address; 
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address); // authorize to call the data contract from app contract

    // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

  });


  it('can register oracles', async () => {
    //if getting tx error, make sure # of accounts is correct in ganache based on TEST_ORACLES_COUNT
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee }); //failing here. Not registering Oracle.
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]}); //Failing here.
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
    //Assert -> seen in logs.
  });

  it('can request flight status', async () => {
    
    // ARRANGE
    let caller = accounts[0];
    let passenger1 = accounts[10];
    let passenger2 = accounts[11];
    let passenger3 = accounts[12];
    const payment = web3.utils.toWei("1","ether");
    const credit = web3.utils.toWei("1.5","ether");
    await config.flightSuretyData.fund(caller, {from: caller, value: payment}); //fund airline
    let flight = "1234"; //strings cannot be passed btw contracts, bc not fixed size.
    let timestamp = 1623983777 //Math.floor(Date.now() / 1000);
 
    //register a flight
    await config.flightSuretyApp.registerFlight(caller, flight, timestamp, {from: caller}); 
    
    
    //check if flight is registered
    let result1 = await config.flightSuretyApp.isFlightRegistered(caller, flight, timestamp); 
    assert.equal(result1,true, "flight could not register correctly"); 
    //let timestamp = Math.floor(Date.now() / 1000);

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(caller, flight, timestamp, {from: caller});
    
    //change flight status to 20 - one that credits insurees.
    await config.flightSuretyApp.changeFlightStatus(caller, flight, timestamp, 20, {from: caller});


    //let result4 = await config.flightSuretyApp.getFlight(caller, flight, timestamp, {from: caller});
    //console.log(result4, result4[1].toNumber(), result4[2].toNumber()); //result4 should be bool.
    
    //3 passengers buy the flight
    await config.flightSuretyApp.buy(caller, flight, timestamp, payment, passenger1, {from: passenger1, value: payment});
    await config.flightSuretyApp.buy(caller, flight, timestamp, payment, passenger2, {from: passenger2, value: payment});
    await config.flightSuretyApp.buy(caller, flight, timestamp, payment, passenger3, {from: passenger3, value: payment});
    //console.log('passenger1 bought: ' + success1);
    //assert.equal(success1, true, "passenger1 bought");
    //assert.equal(success2, true, "passenger2 bought");
    //assert.equal(success3, true, "passenger3 bought");
    


    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
      for(let idx=0;idx<3;idx++) {

        try {
          // Submit a response, it will only be accepted if there is an Index match
          
          await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], caller, flight, timestamp, 20, { from: accounts[a] });
          
          
          // Check to see if flight status is available
          // Only useful while debugging since flight status is not hydrated until a 
          // required threshold of oracles submit a response
          let flightStatus = await config.flightSuretyApp.viewFlightStatus(airline, flight, timestamp);
          console.log('\nPost Flight Status:', idx, oracleIndexes[idx].toNumber(), flight, timestamp, flightStatus.toNumber());
          
        }
        catch(e) {
          // Enable this when debugging
           console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
           //let flightStatus = await config.flightSuretyApp.viewFlightStatus(flight, timestamp);
           //console.log('\nPost Flight Status:', idx, oracleIndexes[idx].toNumber(), flight, timestamp, flightStatus);
           
        }

      }
    }

    let result6 = await config.flightSuretyData.getPassengerCreditAmount(passenger1);
    let result7 = await config.flightSuretyData.getPassengerCreditAmount(passenger2);
    let result8 = await config.flightSuretyData.getPassengerCreditAmount(passenger3);
    console.log('credit Amount: ' + result8.toString());
    
    assert.equal(result6.toString(), credit.toString(), "did not credit correct amount - passenger 1");
    assert.equal(result7.toString(), credit.toString(), "did not credit correct amount - passenger 2");
    assert.equal(result8.toString(), credit.toString(), "did not credit correct amount - passenger 3");
    
    //assert.equal(true, false, "this shows the emits, dont know how to show without it.");
    //assert.equal(1,2, "false freaking false");
    
  });


 
});
