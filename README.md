## timestamp is in miliseconds in javascript
## solidity - timestamp is seconds. have to convert.

# C6A is about 
# registering users.
# changing operational status with multi-party sig

# C6B is Safe Withdraw function,
# and rateLimit and Entrancy protections.
# rate limiting controls the frequency at which a contract operation can be called.
# entrancy protection wont someone call a contract multiple times w/o letting it complete.

## C6C is about separating data and logic. app vs smart contract.
## authorize other contracts to call funcitons in that contract
## contract code: register employee, getBonus, updateEmployee, enables contracts to call functions inside it.
## app contract code: calculate bonus, add sale -> this calls updateEmployee, in constructor takes a datacontract.

## c6D is about oracles.
# 1: register oracles (cost money to register - essentially staking it)
# 2: oracles randomly chosen to get data from (fetchFlightStatus), notify oracles (emit event) that match randomized index
# 3: oracles submit information, if a minimum amount respond with the same information, emit flightStatusInfo to world to see.

# requirements: Airlines
# Airlines: register first airline is automatically deployed on creation, next ones can be registered by any others. 
# registration of fifth and subsequent airlines requires multi-party consensus of 50% or more
# airline can be registered but does not participate in the contract until 10 eth is deposited.

# first airline is registered - CHECK
# can accept funds - CHECK
# now need to register next airline from the app - CHECK 
# block from participating until 10 Eth deposited. - CHECK
# test setting operating status from solo - CHECK
# once 5 or more, need multi-party consensus on setting operating status and registering new airlines - CHECK

# requirements: passengers
# can pay up to 1 eth to participate by buying insurance on a flight.
# flight numbers and timestamps can be fixed just for this project.

# YOU ARE HERE ############################################### - NEED TO FIND A WAY TO DELIVER FUNDS TO PASSENGER

# if flight is delayed, user gets 1.5 x amount paid. - YOU ARE HERE ###########################################
# funds are transferred only if users initiate a withdraw.
#  NEED TO SAVE ALL PASSENGERS TO A FLIGHT. THEN ONCE FLIGHT STATUS CLEARS, CREDIT AN AMOUNT TO EACH PASSENGER IN A FOR LOOP.
# need to 
 
# get oracles running & registered - CHECK
# Fetch flight status -> CHECK
# get oracle response -> CHECK

# oracles 20+ oracles at startup
# oracles implemented as server app
# client dapp is used to trigger request to update flight status, generating oracle request event that is captured by server
# server loops through all registered oracles, identify those for which the request applies, respond with appropriate status code.
# his suggestion: randomize response codes from oracles in node JS   

# oracles.js test will be useful while working on smart contract, but not useful when workign on dapp, will need to switch to server

# truffle migrate helps you test your dapp
# creates config.json files in /src/dapp and /src/server from deploy_contracts.js file
# this sets the contract address to be used, after testing, you'll not want it to change... so can get the address in those files?
# truffle test changes the addresses


# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)