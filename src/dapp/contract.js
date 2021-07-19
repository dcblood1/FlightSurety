import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null; //called in initialize
        this.airlines = [];
        this.passengers = [];
        console.log('app appAddress' + config.appAddress); 
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];
            console.log('owner: ' + this.owner); //this works, creates owner as first contract in ganache.
            let counter = 0;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }



    //airline: 0x0a3C0fd8Ab766C5e43f341Dd91C36f354f11FD71 flight: 010490, timestamp: 631432800
    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0], //always returns self.airlines[0] why?
            flight: flight,
            //timestamp: Math.floor(Date.now() / 1000) //this just returns the current timestamp, want to do the flight.
            //this timestamp shouldnt be the now if it's being passed in, needs to be hard coded even.
            timestamp: 631432800 //needs to be returning 
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    viewFlightStatus(flight, callback) {
        let self = this;
        self.flightSuretyApp.methods
        .viewFlightStatus(self.airlines[0], flight, 631432800)
        .call({from: self.owner}, callback);
    }

    /** 
    //update flight code status
    viewFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: 631432800
        }

        self.flightSuretyApp.methods
            .viewFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({from: self.owner}, (error, result) => {
                callback(error, payload);
                console.log('viewFlighStatus result' + result);

            });
        console.log(payload);
        console.log(result);
        //how do I get the actual number back?    

    }
    */

}