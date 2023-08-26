// SPDX-License-Identifier: MIT
// Developed by: Cristian Richarte Gil
pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./SmartWallet.sol";

/**
 * A sample factory contract for Wallet
 * A UserOperations "initCode" holds the address of the factory, and a method call (to createWallet, in this sample factory).
 * The factory's createWallet returns the target Wallet address even if it is already installed.
 */
contract SmartWalletFactory {
    address public WalletDeployer;
    uint64 immutable CHAINID;

    event SmartWalletCreated(address Owner, address SmartWallet);

    constructor(uint64 chainId) {
        WalletDeployer = msg.sender;
        CHAINID = chainId;
    }

    /**
     * create a Wallet, and return its address.
     * returns the address even if the Wallet is already deployed.
     * Note that during UserOperation execution, this method is called only if the Wallet is not deployed.
     * This method returns an existing or just created Wallet address so that bundler can interact with it.
     */
    function createWallet(
        address owner,
        uint256 salt,
        address priceFeedProxy,
        address ERC20Address
    ) public returns (SmartWallet ret) {
        require(msg.sender == WalletDeployer, "Not allowed");
        address addr = getAddress(owner, salt, priceFeedProxy, ERC20Address);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return SmartWallet(payable(addr));
        }
        ret = SmartWallet(
            new SmartWallet{salt: bytes32(salt)}(
                owner,
                priceFeedProxy,
                CHAINID,
                ERC20Address
            )
        );
        require(addr == address(ret), "Invalid address");
        emit SmartWalletCreated(owner, address(ret));
    }

    /**
     * calculate the counterfactual address of this Wallet as it would be returned by createWallet()
     */
    function getAddress(
        address owner,
        uint256 salt,
        address priceFeedProxy,
        address ERC20Address
    ) public view returns (address) {
        return
            Create2.computeAddress(
                bytes32(salt),
                keccak256(
                    abi.encodePacked(
                        type(SmartWallet).creationCode,
                        abi.encode(owner, priceFeedProxy, CHAINID, ERC20Address)
                    )
                )
            );
    }
}
