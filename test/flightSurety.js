
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    //await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    dataAddress = await config.flightSuretyData.address; 
  });


  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

    ///////////////////////////////////// try to register new airline... one should go with contract out the door.
    it('contract owner is registered as first airline', async () => {
    
        // ARRANGE
        let caller = accounts[0]; // This should be config.owner or accounts[0] for registering a new user
        let newAirline = config.testAddresses[0]; 
    
        //ACT
        //await config.flightSuretyData.registerAirline() ///I dont need to regiester one... I just need to see 
        let result = await config.flightSuretyData.isAirlineRegistered.call(caller) 

        //await config.exerciseC6A.registerUser(newUser, false, {from: caller});
        //let result = await config.exerciseC6A.isUserRegistered.call(newUser); 
    
        // ASSERT
        assert.equal(result, true, "contract owner is not registered as the first airline")
        

    });

    it('sends funds to data contract, and getBalance() works', async () => {

        //arrange
        let caller = accounts[0];
        const payment = web3.utils.toWei("10","ether");

        //ACT
        // send ether to contract
        //await web3.eth.sendTransaction({'to': config.flightSuretyData.address, 'from': caller, 'value': payment});
        let sent = await config.flightSuretyData.fund(caller, {from: caller, value: payment}); // does fail... so thats a good thing right??
        //console.log(sent); //sent is an object, not a bool like I thought.
        console.log(sent.receipt.status); //should be true?
        // getBalance function does not work... don't know why, how do I see
        let result = await config.flightSuretyData.getBalance(); //it worked!
        
        console.log(Number(result)); //this is 0... so fund is not working lolz.
        
        //ASSERT      
        //assert.equal(payment, result); // either of these work? //payment is correct... getBalance() is not.
        assert.equal(sent, result);

        //await web3.eth.sendTransaction({'to': "0x245b347bbE38Dd83c2FE533e0C6f5ca89878BACF", 'from': caller, 'value': payment});
        //let result2 = await web3.eth.getBalance(config.flightSuretyData.address);
        
    })

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });


});