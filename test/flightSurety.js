
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
        //let newAirline2 = config.testAddresses[2]; 
        
        //ACT - register new airline
        let hasPaid = await config.flightSuretyData.hasAirlinePaid(caller);
        //console.log('caller hasPaid? ' + hasPaid);
        await config.flightSuretyApp.registerAirline(newAirline, false, {from: caller}); 
        let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline); 
        //let result2 = await config.flightSuretyData.isAirlineRegistered.call(newAirline2);
        //console.log('newAirline: ' + result); //true
        //console.log('newAirline2: ' + result2); //false

        //ASSERT      
        assert.equal(result, true, "could not register airline");
        //assert.equal(result2, false, "this airline registered incorrectly");
        
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
  
    });


  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
    

  });

  it(`(multiparty) function call is made when multi-party threshold is reached - change operational status`, async function () {

    //Arrange - register and fund 5 accounts 
    let caller = accounts[0];
    let newAirline2 = accounts[1];
    let newAirline3 = accounts[2];
    let newAirline4 = accounts[3];
    const payment = web3.utils.toWei("1","ether");
    
    //register airlines
    await config.flightSuretyApp.registerAirline(newAirline3, false, {from: caller}); 
    await config.flightSuretyApp.registerAirline(newAirline4, false, {from: caller});
    //fund airlines
    await config.flightSuretyData.fund(newAirline2, {from: newAirline2, value: payment});
    await config.flightSuretyData.fund(newAirline3, {from: newAirline3, value: payment});
    await config.flightSuretyData.fund(newAirline4, {from: newAirline4, value: payment});

    //check to ensure approved airlines are correct number
    result = await config.flightSuretyData.getNumberOfApprovedAirlines();//number of registered and funded airlines.
    //console.log(Number(result)); //result is 4 -  correct
    let previousStatus = await config.flightSuretyApp.isOperational.call();
    //console.log('current status before setOperatingStatus: ' + previousStatus);
    
    //Act - vote on multi-party for setting operational status
    await config.flightSuretyApp.setOperatingStatus(false, {from: caller});
    await config.flightSuretyApp.setOperatingStatus(false, {from: newAirline2});
    
    //get current status after changing
    let status = await config.flightSuretyApp.isOperational.call();
    //console.log('current status after setOperatingStatus: ' + status); 
    let multicalls = await config.flightSuretyApp.howManyMultiCalls(); //see how many votes - should be 2
    //console.log('how many multicalls: ' + multicalls); 
    
    //Assert - did action happen?
    assert.equal(status, false, "Incorrect initial operating status value"); //status changed from true to false.
  });

  it(`(multiparty) register 5th or more airlines requires multi-party consensus`, async function () {

    //Arrange - get 4 airlines
    let caller = accounts[0];
    let newAirline2 = accounts[1];
    let newAirline5 = accounts[4];
    const payment = web3.utils.toWei("1","ether");
    //set status back to true
    await config.flightSuretyApp.setOperatingStatus(true, {from: caller});
    await config.flightSuretyApp.setOperatingStatus(true, {from: newAirline2});
    let previousStatus = await config.flightSuretyApp.isOperational.call();
    //console.log('current status before registering : ' + previousStatus);

    let result1 = await config.flightSuretyData.getNumberOfApprovedAirlines(); //number of registered and funded airlines.
    //console.log('Number of approved Airlines in registering: ' + Number(result1));

    //Act - register 5th airline and more
    //register airlines
    await config.flightSuretyApp.registerAirline(newAirline5, false, {from: caller}); 
    await config.flightSuretyApp.registerAirline(newAirline5, false, {from: newAirline2});

    //Assert - 5th airline is registered
    let result = await config.flightSuretyData.isAirlineRegistered(newAirline5);
    await config.flightSuretyData.fund(newAirline5, {from: newAirline5, value: payment});

    let result2 = await config.flightSuretyData.getNumberOfApprovedAirlines(); //number of registered and funded airlines.
    //console.log('Number of approved Airlines after registering: ' + Number(result2));

    assert.equal(true,result, "5th airline did not register correctly with multi-party"); 

  });

  it(`(passangers) - can buy flight insurance on a certain flight, `, async function () {

    //Arrange -- need test account, need flight
    let user1 = accounts[9];
    let user2 = accounts[10];
    let caller = accounts[0];
    let flight = "1234"; 
    const payment = web3.utils.toWei("1","ether");
    const credit = web3.utils.toWei("1.5", "ether");
    console.log('payment: ' + payment);
    let timestamp = 631432800;
    //register a flight
    await config.flightSuretyApp.registerFlight(caller, flight, timestamp, {from: caller});
    
    //check if flight is registered
    let result1 = await config.flightSuretyApp.isFlightRegistered(caller, flight, timestamp, {from: caller}); //check if from data works.
    assert(result1,true, "flight could not register correctly");

    //Act - allow user to purchase insurance for a specific flight
    
    await config.flightSuretyApp.buy(caller, flight, timestamp, payment, user1, {from: user1, value: payment});
        
    //check if passenger is registered
    let result3 = await config.flightSuretyData.isPassengerRegistered(user1);
    console.log('is passenger registered - should be true: ' + result3);
    let result5 = await config.flightSuretyData.isPassengerRegistered(user2);
    console.log('is passenger registered - should be false: ' + result5);
    let result6 = await config.flightSuretyData.getPassengerPaidAmount(user1);
    console.log('did passenger pay - paid amount: ' + result6.toString());  

    //want to test credit insurees
    await config.flightSuretyData.creditInsurees(user1);
    let result4 = await config.flightSuretyData.getPassengerCreditAmount(user1); 
    console.log('credit amount: ' + result4.toString());
    let result7 = await config.flightSuretyData.getPassengerPaidAmount(user1);
    console.log('paid amount after credit, paid should be 0: ' + result7.toString()); 

    //can withdraw money after credit
    let userBeforeCreditPay = await web3.eth.getBalance(user1);
    console.log('user value before credit transfer: ' + userBeforeCreditPay);
    
    await config.flightSuretyApp.payInsuree.sendTransaction({from: user1}); 

    let userAfterCreditPay = await web3.eth.getBalance(user1);
    console.log('user value after credit transfer: ' + userAfterCreditPay);


    //Assert
    assert.equal(result3, true, "user1 could not buy flight insurance")
    assert.equal(result4.toString(), credit.toString(), "credit amount is not correct");
    
  });






});