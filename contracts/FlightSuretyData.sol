pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false


    struct Airline {
        bool isRegistered;        
        bool hasFunded;
    }

    mapping(address => Airline) private airlines; // mapping of address to airline profiles
    uint256 public constant AirlineRegistrationFee = 1 ether; //TODO NEED TO CHANGE TO 10 ETHER #####################################


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
    * @dev Modifier that requires the "airline" account to have funded the contract
    */
    modifier requireAirlineHasPaid()
    {
        require(hasAirlinePaid(msg.sender), "Caller must have paid to participate");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

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
                            requireContractOwner 
                            
    {

        operational = mode;
    }

    //gets balance of the contract.
    function getBalance() public view returns (uint) {
        return address(this).balance;
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
                            requireIsOperational
                            


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
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (                             
                            )
                            external
                            payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
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
                            returns(bool sent)
    {
        require(msg.value >= AirlineRegistrationFee, "Not enough ether submitted, need 10 Ether.");
        sent = address(this).send(msg.value); 
        require(sent, "failed to send ether");
        if (sent) {
            airlines[account].hasFunded = true; 
        }
        
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
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

