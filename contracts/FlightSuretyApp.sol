pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20; // the only one that would pay out to insurees.
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;
    uint256 public constant AirlineRegistrationFee = 10 ether; 

    address private contractOwner;          // Account used to deploy contract
    FlightSuretyData flightSuretyData;      // data function, can now call all functions in flightSuretyData
    bool private operational; //for initial.

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

    address[] multiCalls = new address[](0); // used to track all addresses that call consensus on operating status
    //address[] operatingMultiCalls = new address[](0); // used to track all addresses that call consensus on operating status
    //address[] registeringMultiCalls = new address[](0); // used to track all addresses that call consensus on registering status


 
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
        require(true, "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }


    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
                                (
                                    address dataContract
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContract); 
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return flightSuretyData.isOperational();  // Call data contract's status
    }

    function howManyMultiCalls() public view returns(uint256) {
        return multiCalls.length;
    }

    
    /**
    * Multi-Party Consensus
    * Input -  funded & registered airlines account #'s msg.senders, 
    * Output: added to multi-call array
    * function - check for no duplicates
    */
    function multiPartyConsensus(address account) public returns(bool) 
    {
        require(flightSuretyData.hasAirlinePaid(msg.sender), "Airline Calling is not funded, therefore not a contract participant");

        //no duplicates
        bool isDuplicate = false; //makes sure one admin is not calling it multiple times
        for(uint c=0; c<multiCalls.length; c++) { //normally don't want to iterate through an array, due to potential high gas costs
            if (multiCalls[c] == msg.sender) {
                isDuplicate = true;
                break;
            }
        }
        require(!isDuplicate, "Multi-party Consensus function - Caller has already called this function.");
        
        //push to an array ------ YOU ARE HERE //not gonna be true or false voting, if you call the function, that acts as a vote.
        multiCalls.push(msg.sender); //add admin to array to change mode, if array long enough, enough admins want the change
        
        if (multiCalls.length >= SafeMath.div(flightSuretyData.getNumberOfApprovedAirlines(), 2)) {
            // Safemath always rounds down. so get to 50% or greater 
            multiCalls = new address[](0); //reinitialize multicalls, dont forget this step 
            return true;     
        } else {
            return false;
            }    
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external 

    {

        if (flightSuretyData.getNumberOfApprovedAirlines() >= 4) {
            //multi party consensus for setting operatings status
            if (multiPartyConsensus(msg.sender) == true) {
                flightSuretyData.setOperatingStatus(mode);
            }
        } else{
            require(flightSuretyData.hasAirlinePaid(msg.sender), "airline calling has not funded");
            flightSuretyData.setOperatingStatus(mode); 
        }
    }

    /**
    * checks to see if an airline has paid the 10eth and funded
     */
    function hasAirlinePaid(address account) external view returns(bool) 
    {
        //flightSuretyData.hasAirlinePaid(account); // we have to check in the app if they have paid.
        return flightSuretyData.hasAirlinePaid(account);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

  
   /**
    * @dev Add an airline to the registration queue
    *            
    */   
    function registerAirline
                            (   
                                address account,
                                bool hasFunded
                            )
                            external
                            requireIsOperational()
                            returns(bool success, uint256 votes) //votes to accept airline for multi-chain?
    {
        //callers need to be registered and funded
        require(!flightSuretyData.isAirlineRegistered(account), "Airline is already registered.");
        require(flightSuretyData.hasAirlinePaid(msg.sender), "Airline Calling is not funded, therefore not a contract participant");


        if(flightSuretyData.getNumberOfApprovedAirlines() >= 4) {
            if (multiPartyConsensus(msg.sender) == true) {
                //then register airline
                flightSuretyData.registerAirline(account, hasFunded);
            }
        } else {
            // else if not more than 4 airlines, register airline
            flightSuretyData.registerAirline(account, hasFunded);
            success = true; 
        }
        

        if (flightSuretyData.isAirlineRegistered(account)) {
            success = true;
        } else {
            success = false;
        }

        return (success, 0);
    }


   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
                                (
                                )
                                external
                                pure
    {

    }
    
   /**
    * @dev Called after oracle has updated flight status
    * very important, has to process what happens after a flight status returns. -> only event 20, 
    */  
    function processFlightStatus
                                (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                internal
                                pure
    {
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp                            
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    } 


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   

//this tells the app contract how to interact with this contract very important!
contract FlightSuretyData {
function isAirlineRegistered(address account) external view returns(bool);
function hasAirlinePaid(address account) external view returns(bool);
function registerAirline(address account, bool hasFunded) external; 
function isOperational() view returns(bool);
function setOperatingStatus(bool mode) external;
function getNumberOfApprovedAirlines() external view returns (uint256);
}
