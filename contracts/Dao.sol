//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract DAO {
    using SafeMath for uint256;

    address owner;
    Token public token;
    uint256 public quorum;

    struct Proposal {
        uint256 id;
        string name;
        uint256 amount;
        address payable recipient;
        uint256 votes;
        bool finalized;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public votes;

    event Propose(
        uint256 id, 
        uint256 amount, 
        address recipient,
        address creator
    );

    event Vote(
        uint256 id,
        address investor
    );

    event Finalize(
        uint256 id
    );

    constructor(
        Token _token, 
        uint256 _quorum
    ) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    // allow contrat to receive ether
    receive() external payable {}

    modifier onlyInvestor() {
        require(
            token.balanceOf(msg.sender) > 0, 
            "Must be token holder"
        );
        _;
    }

    function createProposal (
        string memory _name,
        uint256 _amount,
        address payable _recipient
    ) external onlyInvestor {
        require(address(this).balance >= _amount, "Not enough balance");

        proposalCount++;

        proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _amount,
            _recipient,
            0,
            false
        );

        emit Propose(
            proposalCount, 
            _amount, 
            _recipient, 
            msg.sender
        );
    }

    function vote(uint256 _id) external onlyInvestor {
        Proposal storage proposal = proposals[_id];

        // don't let investors vote twice
        require(!votes[msg.sender][_id], "Investor can only vote once");

        // update votes
        proposal.votes += token.balanceOf(msg.sender);

        //track that user has votd
        votes[msg.sender][_id] = true;

        emit Vote(_id, msg.sender);
    }

    function finalizeProposal(uint256 _id) external onlyInvestor {
        // fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // ensure proposal is not already finalized
        require(!proposal.finalized, "Proposal already finalized");

        // mark proposal as finalized
        proposal.finalized = true;

        // check that proposal has enough votes
        require(proposal.votes >= quorum, "Quorum not reached");

        // transfer funds to recipient
        (bool sent, ) = proposal.recipient.call{value: proposal.amount}("");
        require(sent, "Failed to send Ether");

        // emit event
        emit Finalize(_id);
    }

}
