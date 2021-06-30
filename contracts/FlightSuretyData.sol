pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => uint256) authorizedCallers;



    struct Airline {
        bool isRegistered;        
        bool hasFunded;
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
        mapping(address => Passenger) onBoardPassengers; // will this work? can I see what passengers are there? surely I can...
        //TODO: see if this mapping works.
        al;skdjflaksdjfklajsdf;lkajsdf
    }
    

    
    struct Passenger{
        address airline;
        bytes32 flightKey;
        bool isRegistered;
        string flightNumber;
        uint8 paidAmount;
        uint8 creditAmount;
    }

    mapping(address => Passenger) private passengers; // mapping of address to passenger profiles
    mapping(address => Airline) private airlines; // mapping of address to airline profiles
    mapping(bytes32 => Flight) private flights; //mapping of bytes32 flight keys to Flights

    uint256 public constant AirlineRegistrationFee = 1 ether; //TODO NEED TO CHANGE TO 10 ETHER #####################################
    uint256 public constant maxInsuranceAmount = 1 ether;
    address[] approvedAirlines; //can see which airlines addresses are approved, and add 
    
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        //register first airline, not yet funded.
        airlines[msg.sender] = Airline({
                                        isRegistered: true,
                                        hasFunded:false
                                    });
                                   
    }

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
        require(operational, "Contract is currently not operational");
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

    /**
    * @dev Modifier that requires the calling contract to be in the "authorizedCallers" list
    *      This is used on all functions(except those who are called by the contract owner)
    *       to ensure that only the authorized app contracts gain access to the data on this contract
    */
    modifier requireAuthorizedCaller()
    {
        require(authorizedCallers[msg.sender] == 1, "Caller is not authorized, in data contract");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

        //enable other contracts to call function, and authorize them
    function authorizeCaller(address dataContract) external requireContractOwner {
        authorizedCallers[dataContract] = 1;
    }

    function deauthorizeCaller(address dataContract) external requireContractOwner {
        delete authorizedCallers[dataContract];
    }
 
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

   /**
    * @dev Check if an airline is registered
    *
    * @return A bool that indicates if the airline is registered
    */   
    function getNumberOfApprovedAirlines()
                            external
                            view
                            returns(uint256)
    {
        return approvedAirlines.length;
    }

   /**
    * @dev Check if an airline is registered
    *
    * @return A bool that indicates if the airline is registered
    */   
    function isAirlineRegistered
                            (
                                address account
                            )
                            external
                            view
                            returns(bool)
    {
        require(account != address(0), "'account' must be a valid address.");
        
        return airlines[account].isRegistered;
    }

    /**
    * @dev Check if an flight is registered
    *
    * @return A bool that indicates if the flight is registered
    */   
    function isFlightRegistered
                            (
                                bytes32 key
                            )
                            external
                            view
                            returns(bool)
    {
        //returns true or false
        return flights[key].isRegistered;
    }
    
    function viewFlightStatus
                            (
                                bytes32 key
                            )
                            external
                            view
                            returns(uint8)
    {
        //returns true or false
        return flights[key].statusCode;
    }

    function getFlight
                    (
                        bytes32 key
                    ) 
                    external 
                    view 
                    returns ( 
                    bool isRegistered,
                    uint8 statusCode, 
                    uint256 timestamp) {
        
        isRegistered = flights[key].isRegistered;
        statusCode = flights[key].statusCode;
        timestamp = flights[key].updatedTimestamp;

        return (isRegistered, statusCode, timestamp);


                                                            }



    /**
    * @dev Check if an passenger is registered
    *
    * @return A bool that indicates if the passenger is registered
    */   
    function isPassengerRegistered
                            (
                                address account
                            )
                            external
                            view
                            returns(bool)
    {
        require(account != address(0), "'account' must be a valid address.");
        
        return passengers[account].isRegistered;
    }

   /**
    * @dev Check if an airline has funded the contract
    *
    * @return A bool that indicates if the airline has paid the required 10 Eth
    */   
    function hasAirlinePaid
                        (
                            address account
                        )
                        external
                        view 
                        returns (bool)
    {
        require(account != address(0), "'account' must be a valid address.");

        return airlines[account].hasFunded; 
    }



    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
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
                            requireAuthorizedCaller()
    {
        operational = mode;
        
    }

    //gets balance of an address.
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    //check if caller / contract is authorized
    function isAuthorizedCaller(
                                address account
                                )
                                public
                                view 
                                returns(uint256)
    {
        return authorizedCallers[account]; //if authorized caller is 1 then accept
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (
                                address account,
                                bool hasFunded   
                            )
                            external
                            requireIsOperational()

    {
        // ensure that the airline is not already registered
        require(!airlines[account].isRegistered, "Airline is already registered.");
        
        //register the airline, but not paid yet, then they need to pay to participate.
        airlines[account] = Airline({
                                        isRegistered: true,
                                        hasFunded: false
                                    });
    }

    /**
    * @dev Add a flight to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerFlight
                            (
                                bytes32 flightKey,
                                address airline,
                                uint256 timestamp 
                            )
                            external
                            requireIsOperational()

    {
        //register the flight
        flights[flightKey] = Flight({
            isRegistered: true,
            statusCode:10,
            updatedTimestamp: timestamp,
            airline: airline
        });
    }



   /**
    * @dev Buy insurance for a flight
    *input: flightNumber, how much eth, up to 1eth
    *output: return true
    * function: transfer funds to the insurance contract
    * note that the user bought it on that flight
    */   
    function buy
                            (
                                address airline,
                                string flight,
                                uint256 timestamp,
                                uint8 amount,
                                address passenger                             
                            )
                            external //called externally from another contract
                            payable // able to send ether
                            
    {

        //ensure amount is less than one eth
        require(msg.value < maxInsuranceAmount, "Max of One ether allowed, submit less.");
        
        //first send transaction        
        bool sent = address(this).send(msg.value); 
        require(sent, "failed to send ether");
        bytes32 key = keccak256(abi.encodePacked(airline, flight, timestamp));
        
        passengers[passenger] = Passenger({
            airline: airline,
            flightNumber: flight,
            flightKey: key,
            paidAmount: amount,
            isRegistered: true
        });
        
        //TODO: then add passenger to the flight struct, in passenger
        flights[key].passenger[]
        

    }

    /**
     *  @dev Credits payouts to insurees
     * input: user account number, 
     * amount to give back * input amount
     * // so this just puts the number in their account.
    */
    function creditInsurees
                                (
                                    address passengerAccount
                                )
                                external
                                returns(uint8 creditAmount)
                                
    {
        
        
        uint8 amount = passengers[passengerAccount].paidAmount; 
        require(amount >0, "amount paid must be greater than 0");

        //function: cannot do 1.5, so muliply by 3, divide by 2.
        uint8 amt = SafeMath.mul(amount, 3);
        uint8 creditAmount = SafeMath.div(amt, 2);
        passengers[passengerAccount].paidAmount = 0; // set the paid amount to 0, then credit their account
        passengers[passengerAccount].creditAmount = creditAmount;
        
        // return amount credited to their account
        return creditAmount; 

        

    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     * called by passenger to get funds out.
     *
    */
    function pay
                            (
                            )
                            external
                            
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (
                                address account
                                   
                            )
                            public
                            payable
                            //need to put in modifier that caller has funded. 
                            returns(bool sent)
    {
        require(msg.value >= AirlineRegistrationFee, "Not enough ether submitted, need 10 Ether.");
        // make sure they have not already funded
        require(airlines[account].hasFunded == false, "Airline has already funded");
        sent = address(this).send(msg.value); 
        require(sent, "failed to send ether");
        if (sent) {
            airlines[account].hasFunded = true; 
            approvedAirlines.push(account); //adds to list of approved airlines for multi-party call
        }
        
    }

    function getFlightKey
                        (
                            address airline,
                            string flight, // was string memory flight - I changed it...
                            uint256 timestamp
                        )
                        external
                        returns(bytes32) 
    {
        
        return keccak256(abi.encodePacked(airline, flight, timestamp));
        
    }



    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        //fund();
    }
    

}

