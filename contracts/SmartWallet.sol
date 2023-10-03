// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Importing ERC721Holder from OpenZeppelin contracts
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
// Importing ERC1155Holder from OpenZeppelin contracts
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
// Importing AggregatorV3Interface from Chainlink contracts
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// Importing IERC20Extended interface
import "./interfaces/IERC20Extended.sol";

/**
 * @title SmartWallet
 * @author Cristian Richarte Gil
 * @dev A smart contract that facilitates transaction execution and fee payment using ERC20 tokens.
 */
contract SmartWallet is ERC721Holder, ERC1155Holder {
    // Chainlink price feed interface
    AggregatorV3Interface internal immutable priceFeed;

    // Hashed name constant for the ERC20 Fee Smart Account
    bytes32 private constant _HASHED_NAME =
        keccak256("ERC20 Fee Smart Account");

    // Version constant for the Smart Wallet
    string public constant version = "1.0";

    // Owner of the Smart Wallet
    address payable public immutable owner;
    // Chain ID for the Blockchain your are deploying the Smart Wallet
    uint64 private immutable CHAIN_ID;
    // Desired ERC20 token address to pay for fees
    IERC20 private immutable ERC20Token;
    // Incremental Nonce for each Smart Wallet Transaction
    uint256 public nonce;

    // Protocol fee % to avoid lossing for Exchange rate.
    uint8 constant protocolFee = 20;

    // Estimated Gas spent for ERC-20 Transfer
    uint256 private constant POST_OP_GAS = 51494;

    // Event emitted after operation is finished
    event postOpFinished(uint256 ERC20Receipt, uint256 gasReceipt);

    /**
     * @dev Constructor for the Smart Wallet
     * @param _owner The owner of the Smart Wallet
     * @param priceFeedProxy The address of the price feed proxy
     * @param chainId The chain ID of the blockchain
     * @param ERC20 The address of the ERC20 token for fee payment
     */
    constructor(
        address _owner,
        address priceFeedProxy,
        uint64 chainId,
        address ERC20
    ) {
        owner = payable(_owner);
        priceFeed = AggregatorV3Interface(priceFeedProxy);
        CHAIN_ID = chainId;
        ERC20Token = IERC20(ERC20);
    }

    /*********************************************************VERIFICATION PROCESS*/

    /**
     * @dev Verifies if the provided signature is valid for the given transaction details.
     * @param target The target address of the transaction
     * @param callData The call data of the transaction
     * @param value The value of the transaction
     * @param _nonce The nonce of the transaction
     * @param signature The signature of the transaction
     * @return bool Returns true if the signature is valid
     */
    function verifySignature(
        address target,
        bytes memory callData,
        uint256 value,
        uint256 _nonce,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 messageHash = getMessageHash(target, callData, value, _nonce);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == owner;
    }

    /**
     * @dev Computes the hash of the transaction message for signature verification.
     * @param target The target address of the transaction
     * @param callData The call data of the transaction
     * @param value The value of the transaction
     * @param _nonce The nonce of the transaction
     * @return bytes32 Returns the message hash
     */
    function getMessageHash(
        address target,
        bytes memory callData,
        uint256 value,
        uint256 _nonce
    ) public view returns (bytes32) {
        bytes memory packedData = abi.encode(
            target,
            _nonce,
            callData,
            value,
            CHAIN_ID
        );
        bytes32 messageHash = keccak256(packedData);
        return messageHash;
    }

    /**
     * @dev Computes the hash of the message for creating an Ethereum signed message.
     * @param _messageHash The message hash
     * @return bytes32 Returns the Ethereum signed message hash
     */
    function getEthSignedMessageHash(
        bytes32 _messageHash
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    /**
     * @dev Recovers the signer's address from a given signature.
     * @param _ethSignedMessageHash The Ethereum signed message hash
     * @param _signature The signature
     * @return address Returns the address of the signer
     */
    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    /**
     * @dev Splits the signature into its components.
     * @param sig The signature
     * @return r bytes32 Returns the r component of the signature
     * @return s bytes32 Returns the s component of the signature
     * @return v uint8 Returns the v component of the signature
     */
    function splitSignature(
        bytes memory sig
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    /*********************************************************EXECUTION PROCESS*/

    /**
     * @dev Executes a single transaction and handles fee payment.
     * @param target The target address of the transaction
     * @param value The value of the transaction
     * @param callData The call data of the transaction
     * @param signature The signature of the transaction
     * @param gasPrice The gas price for the transaction
     * @param isSponsored If set as true, no ERC20 refund is required
     */
    function handleOp(
        address target,
        uint256 value,
        bytes memory callData,
        bytes memory signature,
        uint256 gasPrice,
        bool isSponsored // If set as true, no ERC20 refund is required
    ) public payable {
        uint256 preGas = gasleft();
        require(gasPrice != 0, "GasPrice cannot be 0");
        executeOp(target, value, callData, signature, nonce);
        if (!isSponsored || (msg.sender != owner && !isSponsored)) {
            uint256 gasLeft = gasleft();
            postOp(preGas - gasLeft, gasPrice);
        }
    }

    /**
     * @dev Executes multiple transactions and handles fee payment.
     * @param target The target addresses of the transactions
     * @param value The values of the transactions
     * @param callData The call data of the transactions
     * @param signature The signatures of the transactions
     * @param gasPrice The gas price for the transactions
     * @param isSponsored If set as true, no ERC20 refund is required
     */
    function handleOps(
        address[] memory target,
        uint256[] memory value,
        bytes[] memory callData,
        bytes[] memory signature,
        uint256 gasPrice,
        bool isSponsored // If set as true, no ERC20 refund is required
    ) external payable {
        uint256 preGas = gasleft();
        require(target.length == callData.length, "wrong array lengths");
        require(value.length == callData.length, "wrong array lengths");
        require(signature.length == callData.length, "wrong array lengths");
        require(gasPrice != 0, "GasPrice cannot be 0");

        uint256 iterations = target.length;
        for (uint256 i = 0; i < iterations; ) {
            executeOp(target[i], value[i], callData[i], signature[i], nonce);
            unchecked {
                i++;
            }
        }

        uint256 gasLeft = gasleft();
        if (!isSponsored || (msg.sender != owner && !isSponsored)) {
            postOp(preGas - gasLeft, gasPrice);
        }
    }

    /**
     * @dev Executes a single operation by verifying the signature and calling the target.
     * @param target The target address of the transaction
     * @param value The value of the transaction
     * @param callData The call data of the transaction
     * @param signature The signature of the transaction
     * @param _nonce The nonce of the transaction
     * @return bytes memory Returns the result of the call
     */
    function executeOp(
        address target,
        uint256 value,
        bytes memory callData,
        bytes memory signature,
        uint256 _nonce
    ) internal returns (bytes memory) {
        bool verified = verifySignature(
            target,
            callData,
            value,
            _nonce,
            signature
        );
        require(verified, "Invalid signature");
        unchecked {
            nonce++;
        }
        return _call(target, value, callData);
    }

    /**
     * @dev Calls the target contract with the provided data and value.
     * @param target The target address of the call
     * @param value The value of the call
     * @param data The data of the call
     * @return bytes memory Returns the result of the call
     */
    function _call(
        address target,
        uint256 value,
        bytes memory data
    ) internal returns (bytes memory) {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        return result;
    }

    /**
     * @dev Handles post-operation logic, including fee payment in ERC20 tokens.
     * @param gasUsed The gas used for the operation
     * @param gasPrice The gas price for the operation
     */
    function postOp(uint256 gasUsed, uint256 gasPrice) internal {
        uint256 gasReceipt = ((((gasUsed + POST_OP_GAS))) * (gasPrice)) /
            (10 ** ERC20Token.decimals());
        uint256 ERC20Fee = (gasReceipt * uint256(getLatestPrice())) /
            (10 ** ERC20Token.decimals());
        // Important to check returns as it can interact with any ERC20.
        bool success = ERC20Token.transfer(
            msg.sender,
            ERC20Fee + ((ERC20Fee * protocolFee) / 100)
        );
        require(success, "Failed erc20 transfer");
        emit postOpFinished(ERC20Fee, gasReceipt);
    }

    /**
     * @dev Returns the latest price of ARB to the ERC20 Set.
     * @return int Returns the latest price
     */
    function getLatestPrice() internal view returns (int) {
        (
            ,
            /* uint80 roundID */ int price /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/,
            ,
            ,

        ) = priceFeed.latestRoundData();
        require(price != 0, "Oracle error");
        return price;
    }

    /**
     * @dev Function to receive Ether
     */
    receive() external payable {}
}
