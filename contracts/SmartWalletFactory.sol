// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Importing Create2 utility from OpenZeppelin contracts
import "@openzeppelin/contracts/utils/Create2.sol";
// Importing ERC1967Proxy from OpenZeppelin contracts
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
// Importing SmartWallet contract
import "./SmartWallet.sol";

/**
 * @title SmartWalletFactory
 * @author Cristian Richarte Gil
 * @dev A factory contract for creating SmartWallet instances.
 * The UserOperations "initCode" holds the address of the factory, and a method call (to createWallet, in this sample factory).
 * The factory's createWallet returns the target Wallet address even if it is already installed.
 */
contract SmartWalletFactory {
    // Address of the Wallet Deployer
    address public WalletDeployer;
    // Immutable Chain ID
    uint64 immutable CHAINID;

    /**
     * @dev Event emitted when a new SmartWallet is created 
     */
    event SmartWalletCreated(address Owner, address SmartWallet);

    /**
     * @dev Constructor for the SmartWalletFactory
     * @param chainId The chain ID of the blockchain
     */
    constructor(uint64 chainId) {
        WalletDeployer = msg.sender;
        CHAINID = chainId;
    }

    /**
     * @dev Creates a SmartWallet, and return its address.
     * Returns the address even if the Wallet is already deployed.
     * Note that during UserOperation execution, this method is called only if the Wallet is not deployed.
     * This method returns an existing or just created Wallet address so that bundler can interact with it.
     * @param owner The owner of the Smart Wallet
     * @param salt The salt for creating the Smart Wallet
     * @param priceFeedProxy The address of the price feed proxy
     * @param ERC20Address The address of the ERC20 token for fee payment
     * @return ret Returns the SmartWallet instance
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
     * @dev Calculates the counterfactual address of this Wallet as it would be returned by createWallet()
     * @param owner The owner of the Smart Wallet
     * @param salt The salt for creating the Smart Wallet
     * @param priceFeedProxy The address of the price feed proxy
     * @param ERC20Address The address of the ERC20 token for fee payment
     * @return Returns the counterfactual address
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
