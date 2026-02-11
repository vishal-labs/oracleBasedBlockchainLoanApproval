// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockResolver {
    mapping(bytes32 => address) public addrs;
    mapping(bytes32 => mapping(string => string)) public texts;

    function setAddr(bytes32 _node, address _addr) external {
        addrs[_node] = _addr;
    }

    function addr(bytes32 node) external view returns (address) {
        return addrs[node];
    }

    function setText(bytes32 _node, string calldata _key, string calldata _value) external {
        texts[_node][_key] = _value;
    }

    function text(bytes32 node, string calldata key) external view returns (string memory) {
        return texts[node][key];
    }
}
