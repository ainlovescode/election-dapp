pragma solidity ^0.4.24;

contract Election {

    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct Voter {
        address voterAddress;
        string voterNatId;
        string voterName;
        string voterPass;
    }

    // Store accounts that are verified
    mapping(address => bool) public verified;
    // Store accounts that have voted
    mapping(address => bool) public voters;
    // Store Candidates
    // Fetch Candidate
    mapping(uint => Candidate) public candidates;
    // Store Candidates Count
    uint public candidatesCount;
    address public admin;

    bool public isOpen;

    // voted event
    event votedEvent (
        uint indexed _candidateId
    );

    constructor () public {
        admin = msg.sender;

        addCandidate("Candidate 1");
        addCandidate("Candidate 2");

        isOpen = true;
    }

    function addCandidate (string memory _name) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(isOpen == true);
        require(!voters[msg.sender]);
        

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        // trigger voted event
        votedEvent(_candidateId);
    }

    function closeElection() public {
        require(msg.sender == admin);
        
        isOpen = false;
    }
    function openElection() public {
        require(msg.sender == admin);
        
        isOpen = true;
    }
}
