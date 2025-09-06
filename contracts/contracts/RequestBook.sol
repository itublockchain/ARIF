pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RequestBook {
    struct BorrowRequest {
        uint id;
        uint amount;
        address borrower;
        address assetERC20Address;
    }

    struct Loan {
        bool isFilled;
        uint borrowID;
        address lender;
    }

    mapping(uint => BorrowRequest) public borrowRequestByID;
    mapping(address => uint) public addressToBorrowID;
    mapping(address => uint[]) public borrowRequestIDS;
    mapping(uint => bool) public cancelledBorrowRequests;

    mapping(uint => Loan) public loanByBorrowID;
    mapping(address => uint[]) public loansByBorrowID;

    uint public nextID;

    function createBorrowRequest(uint amount, address assetERC20Address) public {
        uint id = nextID;
        nextID++;

        borrowRequestByID[id] = BorrowRequest({
            id: id,
            borrower: msg.sender,
            amount: amount,
            assetERC20Address: assetERC20Address
        });

        addressToBorrowID[msg.sender] = id;
        borrowRequestIDS[msg.sender].push(id);
    }

    function cancelBorrowRequest(uint borrowID) public {
        require(borrowRequestByID[borrowID].borrower == msg.sender, "You are not the borrower");
        require(!loanByBorrowID[borrowID].isFilled, "It is already filled");

        cancelledBorrowRequests[borrowID] = true;
    }

    function createLoan(uint borrowID) public {
        require(!cancelledBorrowRequests[borrowID], "Borrow request cancelled");
        require(!loanByBorrowID[borrowID].isFilled, "It is already filled");

        bool success = IERC20(borrowRequestByID[borrowID].assetERC20Address).transferFrom(msg.sender, borrowRequestByID[borrowID].borrower, borrowRequestByID[borrowID].amount);
        
        require(success, "createLoan: Transfer failed");

        loanByBorrowID[borrowID] = Loan(true, borrowID, msg.sender);
        loansByBorrowID[msg.sender].push(borrowID);
    }

    function getBorrowRequest(uint borrowID) public view returns (BorrowRequest memory) {
        return borrowRequestByID[borrowID];
    }

    function getAllLoans(address lender) public view returns (uint[] memory) {
        return loansByBorrowID[lender];
    }

}