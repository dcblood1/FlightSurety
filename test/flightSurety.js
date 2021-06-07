
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    dataAddress = await config.flightSuretyData.address; 
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address); // authorize to call the data contract from app contract
  });


  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

    it('contract owner is registered as first airline', async () => {
    
        // ARRANGE
        let caller = accounts[0]; // This should be config.owner or accounts[0] for registering a new user   
    
        //ACT
        //await config.flightSuretyData.registerAirline() ///I dont need to regiester one... I just need to see 
        let result = await config.flightSuretyData.isAirlineRegistered.call(caller) 

        //await config.exerciseC6A.registerUser(newUser, false, {from: caller});
        //let result = await config.exerciseC6A.isUserRegistered.call(newUser); 
    
        // ASSERT
        assert.equal(result, true, "contract owner is not registered as the first airline")
        

    });

    
    it('sends funds to data contract, and getBalance() / fund works', async () => {

        //arrange
        let caller = accounts[0];
        const payment = web3.utils.toWei("1","ether");

        //ACT
        // send ether to contract
        let sent = await config.flightSuretyData.fund(caller, {from: caller, value: payment}); 
        //console.log(sent.receipt.status); //true if the transaction went through
        let result = await config.flightSuretyData.getBalance(); //Get balance of Data Contract
        
        //ASSERT      
        //assert.equal(sent, result);

        //await web3.eth.sendTransaction({'to': "0x245b347bbE38Dd83c2FE533e0C6f5ca89878BACF", 'from': caller, 'value': payment});
        //let result2 = await web3.eth.getBalance(config.flightSuretyData.address);
        
    })
    

    it('Can register second airline from initial airline', async () => {

        //Arrange
        let caller = accounts[0];
        let newAirline = accounts[1]; 
        let newAirline2 = config.testAddresses[2]; 
        
        //ACT - register new airline
        let hasPaid = await config.flightSuretyData.hasAirlinePaid(caller);
        //console.log('caller hasPaid? ' + hasPaid);
        await config.flightSuretyApp.registerAirline(newAirline, false, {from: caller}); //why does this not work then? 
        let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline); 
        let result2 = await config.flightSuretyData.isAirlineRegistered.call(newAirline2);
        //console.log('newAirline: ' + result); //true
        //console.log('newAirline2: ' + result2); //false

        //ASSERT      
        assert.equal(result, true, "could not register airline");
        assert.equal(result2, false, "this airline registered incorrectly");
        
    })
    it('Can set operational status from one caller - not multi-sig', async () => {

        //Arrange
        let caller = accounts[0];
                
        //ACT -set operating status from caller
        let previousStatus = await config.flightSuretyApp.isOperational.call(); // True initially
        //console.log('Previous operational status: ' + previousStatus);
        let hasPaid = await config.flightSuretyApp.hasAirlinePaid(caller); // Coming from contract not the caller
        //console.log('caller has paid: ' + hasPaid); 
        await config.flightSuretyApp.setOperatingStatus(false, {from: caller});
        let status = await config.flightSuretyApp.isOperational.call();
        //console.log('current Status after app call: ' + status); // False
        
        //ASSERT      
        assert.equal(!previousStatus,status, "status did not change"); 

         //change operating status back to true
         await config.flightSuretyApp.setOperatingStatus(true, {from: caller});
  
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