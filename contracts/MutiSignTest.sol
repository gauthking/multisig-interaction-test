//SPDX-License-Identifier:MIT
pragma solidity ^0.8.17;
import "./ISignatureValidator.sol";
import "./OwnerManager.sol";
import "./SafeMath.sol";
import "./IERC1271.sol";

contract sign1 is ISignatureValidatorConstants, OwnerManager {
    mapping(address => mapping(bytes32 => uint256)) public approvedRecords;
    using SafeMath for uint256;
    address[] public owners1;

    function returnOwners() public view returns (address[] memory) {
        return owners1;
    }

    function signatureSplit(
        bytes memory signatures,
        uint256 pos
    ) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        assembly {
            let signaturePos := mul(0x41, pos)
            r := mload(add(signatures, add(signaturePos, 0x20)))
            s := mload(add(signatures, add(signaturePos, 0x40)))
            v := and(mload(add(signatures, add(signaturePos, 0x41))), 0xff)
        }
    }

    function getEthSignedMsgHash(
        bytes32 _hashedMsg
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", _hashedMsg)
            );
    }

    function checkNSignatures(
        bytes32 dataHash,
        uint256 signatureCount,
        bytes memory signatures
    ) public {
        require(
            signatures.length >= signatureCount * 65,
            "signatures too short"
        );
        address lastOwner = address(0);
        address currentOwner;
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 i;
        for (i = 0; i < signatureCount; i++) {
            (v, r, s) = signatureSplit(signatures, i);
            if (v == 0) {
                // Handle contract signature
                currentOwner = address(uint160(uint256(r)));
                require(
                    uint256(s) >= signatureCount * 65,
                    "contract signatures too short"
                );
                require(
                    uint256(s) + (32) <= signatures.length,
                    "contract signatures out of bounds"
                );
                uint256 contractSignatureLen;
                assembly {
                    contractSignatureLen := mload(add(add(signatures, s), 0x20))
                }
                require(
                    uint256(s) + 32 + contractSignatureLen <= signatures.length,
                    "contract signature wrong offset"
                );
                bytes memory contractSignature;
                assembly {
                    contractSignature := add(add(signatures, s), 0x20)
                }
                (bool success, bytes memory result) = currentOwner.staticcall(
                    abi.encodeWithSelector(
                        IERC1271.isValidSignature.selector,
                        dataHash,
                        contractSignature
                    )
                );
                require(
                    success &&
                        result.length == 32 &&
                        abi.decode(result, (bytes32)) ==
                        bytes32(IERC1271.isValidSignature.selector),
                    "contract signature invalid"
                );
            } else if (v == 1) {
                // Handle approved hash
                currentOwner = address(uint160(uint256(r)));
                require(
                    msg.sender == currentOwner ||
                        approvedRecords[currentOwner][dataHash] != 0,
                    "approve hash verify failed"
                );
            } else {
                // EIP712 verify
                currentOwner = ecrecover(dataHash, v, r, s);
                owners1.push(currentOwner);
            }
            lastOwner = currentOwner;
        }
    }
}

// SignatureEncoder.sol

contract SignatureEncoder {
    function encodeSignatures(
        bytes memory signatures
    ) public pure returns (bytes memory) {
        return signatures;
    }
}
