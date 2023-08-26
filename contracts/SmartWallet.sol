// SPDX-License-Identifier: MIT
// Developed by: Cristian Richarte Gil
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title SmartWallet
 * @dev A smart contract that facilitates transaction execution and fee payment using ERC20 tokens.
 */
contract SmartWallet is ERC721Holder, ERC1155Holder {
    AggregatorV3Interface internal immutable priceFeed;

    bytes32 private constant _HASHED_NAME =
        keccak256("ERC20 Fee Smart Account");

    string public constant version = "1.0";

    address payable public immutable owner; // Transaction signer and Owner
    uint64 private immutable CHAIN_ID; // Chain ID for the Blockchain your are deploying the Smart Wallet
    address private immutable ERC20Address; // Desired ERC20 token address to pay for fees
    uint256 public nonce; // Incremental Nonce for eache Smart Wallet Transaction

    uint256 private constant POST_OP_GAS = 51494; // Estimated Gas spent for ERC-20 Transfer

    event postOpFinished(uint256 ERC20Receipt, uint256 gasReceipt);

    constructor(
        address _owner,
        address priceFeedProxy,
        uint64 chainId,
        address ERC20
    ) {
        owner = payable(_owner);
        priceFeed = AggregatorV3Interface(priceFeedProxy);
        CHAIN_ID = chainId;
        ERC20Address = ERC20;
    }

    /*********************************************************VERIFICATION PROCESS*/

    /**
     * @dev Verifies if the provided signature is valid for the given transaction details.
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
        if (!isSponsored) {
            uint256 gasLeft = gasleft();
            postOp(preGas - gasLeft, gasPrice);
        }
    }

    /**
     * @dev Executes multiple transactions and handles fee payment.
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
        if (!isSponsored) {
            postOp(preGas - gasLeft, gasPrice);
        }
    }

    /**
     * @dev Executes a single operation by verifying the signature and calling the target.
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
     */
    function postOp(uint256 gasUsed, uint256 gasPrice) internal {
        uint256 gasReceipt = (((gasUsed + POST_OP_GAS + 21000))) * (gasPrice);
        uint256 ERC20Fee = gasReceipt * uint256(getLatestPrice());

        IERC20(ERC20Address).transfer(msg.sender, ERC20Fee);
        emit postOpFinished(ERC20Fee, gasReceipt);
    }

    /**
     * @dev Returns the latest price of ARB to the ERC20 Set.
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

    receive() external payable {}
}
