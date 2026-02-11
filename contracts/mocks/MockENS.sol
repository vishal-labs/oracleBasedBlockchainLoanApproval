// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockENS {
    mapping(bytes32 => address) public resolvers;

    function setResolver(bytes32 _node, address _resolver) external {
        resolvers[_node] = _resolver;
    }

    function resolver(bytes32 node) external view returns (address) {
        return resolvers[node];
    }
}
