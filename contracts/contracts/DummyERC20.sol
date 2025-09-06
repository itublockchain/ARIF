//spdx
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DummyERC20 is ERC20 {
    constructor() ERC20("DummyERC20", "DUMMY") {
        _mint(msg.sender, 1000000000000000000000000);
    }
}