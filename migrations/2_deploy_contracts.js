const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer) {

    let firstAirline = '0x0a3C0fd8Ab766C5e43f341Dd91C36f354f11FD71';  //change each time with new ganache
    deployer.deploy(FlightSuretyData)
    .then(() => {
        return deployer.deploy(FlightSuretyApp, FlightSuretyData.address) // look at your constructor - took away firstAirline, added data.address
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:7545', //was 8545 but my ganache is 7545
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address
                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8'); // this creates the config.json file in dapp and server
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                });
    });
}