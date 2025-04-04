// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BlindAuction {
    struct Bid {
        bytes32 blindedBid;
        uint deposit;
    }

    // Phases will be set only by external agents and not by time "now"
    // Enum-uint mapping:
    // Init - 0; Bidding - 1; Reveal - 2; Done - 3
    enum Phase {Init, Bidding, Reveal, Done}
    // Owner
    address payable public beneficiary;
    // Keep track of the highest bid,bidder
    address public highestBidder;
    uint public highestBid = 0;
    // Only one bid allowed per address
    mapping(address => Bid) public bids;
    mapping(address => uint) pendingReturns;

    Phase public currentPhase = Phase.Init;
    // Events
    event AuctionEnded(address winner, uint highestBid);
    event BiddingStarted();
    event RevealStarted();
    event AuctionInit();
    // Modifiers
    modifier validPhase(Phase phase) {
        require(currentPhase == phase, "phaseError");
        _;
    }
    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "onlyBeneficiary");
        _;
    }

    constructor() {
        beneficiary = payable(msg.sender);
        // advancePhase();
    }

    function advancePhase() public onlyBeneficiary {
        // If already in done phase, reset to init phase
        if (currentPhase == Phase.Done) {
            currentPhase = Phase.Init;
        } else {
            // else, increment the phase
            // Conversion to uint needed as enums are internally uints
            uint nextPhase = uint(currentPhase) + 1;
            currentPhase = Phase(nextPhase);
        }

        // Emit appropriate events for the new phase
        if (currentPhase == Phase.Reveal) emit RevealStarted();
        if (currentPhase == Phase.Bidding) emit BiddingStarted();
        if (currentPhase == Phase.Init) emit AuctionInit();
    }

    function bid(bytes32 blindBid) public payable validPhase(Phase.Bidding) {
        require(msg.sender != beneficiary,'beneficiaryBid');    // Beneficiary should not be allowed to place bids
        bids[msg.sender] = Bid({blindedBid: blindBid, deposit: msg.value});
    }

    function reveal(uint value, bytes32 secret) public validPhase(Phase.Reveal) {
        // Note uint value must be correctly parsed for ether in wei
        require(msg.sender != beneficiary,'beneficiaryReveal');
        uint refund = 0;
        Bid storage bidToCheck = bids[msg.sender];

        if (bidToCheck.blindedBid == keccak256(abi.encodePacked(value, secret))) {
            refund += bidToCheck.deposit;
            if (bidToCheck.deposit >= value) {
                if (placeBid(msg.sender, value))
                    refund -= value;
            }
        }
        // Return the remaining deposit (if any)
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
    }

    // This is an "internal" function which means that it
    // can only be called from the contract itself (or from
    // derived contracts).
    function placeBid(address bidder, uint value) internal returns (bool success)
    {
        if (value <= highestBid) {
            return false;
        }
        if (highestBidder != address(0)) {
            // Refund the previously highest bidder.
            pendingReturns[highestBidder] += highestBid;
        }

        highestBid = value;
        highestBidder = bidder;
        return true;
    }

    // Withdraw a non-winning bid
    function withdraw() public {
        uint amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
        }
    }

    // Send the highest bid to the beneficiary and
    // end the auction
    function auctionEnd() public validPhase(Phase.Done) {
        if(address(this).balance >= highestBid){
            beneficiary.transfer(highestBid);
        }
        emit AuctionEnded(highestBidder, highestBid);
    }

    function closeAuction() public onlyBeneficiary {
        selfdestruct(beneficiary);
    }
}
