pragma solidity ^0.8.28;

contract KYC {
    struct User {
        string name;
        string surname;
    }
    mapping(address => User) public users;

    function setUser(string memory name, string memory surname) public {
        users[msg.sender] = User(name, surname);
    }

    function getUser(address user) public view returns (User memory) {
        return users[user];
    }
}