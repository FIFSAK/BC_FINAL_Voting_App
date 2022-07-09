// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract Chat {
    string[] st;

    function add(string memory newValue) public {
        st.push(newValue);
    }

    function getSt() public view returns (string[] memory) {
        return st;
    }
}