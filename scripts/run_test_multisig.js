const ethers = require('ethers');
const contractArtifact = require('../artifacts/contracts/MutiSignTest.sol/sign1.json')
const provider = new ethers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/lCTz9baW9Wdl5DbGGhU0x7JGHMZeFuC-');
const contractAddress = "0x18684F8453b32b05c3a378D2831d2356Bf9d8d87";

const getEthSignedMsgHash = async (dataHash) => {
    const checkSignersContract = new ethers.Contract(contractAddress, contractArtifact.abi, provider);
    let eth_signed_msg_hash = await checkSignersContract.getEthSignedMsgHash(dataHash);
    // console.log("Eth Signed Msg Hash - ", eth_signed_msg_hash);
    return eth_signed_msg_hash;
}

const signMessage = async (dataHash, executorWallet) => {
    try {
        const signature = await executorWallet.signingKey.sign(dataHash)
        const finalSign = signature.r + signature.s.slice(2) + signature.v.toString(16);
        console.log(`Signature on ${dataHash} by ${executorWallet.address} : ${finalSign}`);
        return finalSign;
    } catch (error) {
        console.log("An error occured at signMessage function -", error)
    }

}

const testCheckNSignatures = async (ethSignedMsgHash, requiredSignatures, concatenatedSignature) => {
    try {
        // creating the contract instance using the contractAddress (i deployed it using hardhat and got the address)
        const checkSignersContract = new ethers.Contract(contractAddress, contractArtifact.abi, provider);
        // input the private key
        const privKey0 = '';
        // create a wallet instance
        const wallet = new ethers.Wallet(privKey0, provider)
        // make a tx call to the contract on behalf of wallet and invoke the checkNSignatures function by passing the required parameters
        const tx = await checkSignersContract.connect(wallet).checkNSignatures(ethSignedMsgHash, requiredSignatures, concatenatedSignature);

        // send the transaction
        const txResponse = await tx.wait();
        console.log('Transaction Hash:', txResponse.transactionHash);
    } catch (error) {
        console.log("An error occured at the testCheckNSignatures function - ", error)
    }
}


const main = async () => {
    // private keys of the signers.. only for testing purposes.. we can input them here..
    const privKey0 = '';
    const privKey1 = '';

    // creating eth wallet instances using privkey and alchemy providers(polygon_mumbai)
    const executor0 = new ethers.Wallet(privKey0, provider)
    const executor1 = new ethers.Wallet(privKey1, provider)

    // required signatures to be passed to checkNSignatures function
    const requiredSignatures = 2;

    // original data hash 
    const dataHash = '0x574f289267defd4d5fb6b2dd2ba05b0029078ff6b78594105e537ac7fe1d3c3a';

    // ethereum signed prefix data hash - digest (this would be also passed as an input to the checkNSignatures fn)
    const ethSignedMsgHash = await getEthSignedMsgHash(dataHash);

    // getting the individual signatures from the signers/executors
    const signedMsg0 = await signMessage(ethSignedMsgHash, executor0);
    const signedMsg1 = await signMessage(ethSignedMsgHash, executor1);


    console.log("Signed Message 0 - ", signedMsg0)
    console.log("Signed Message 1 - ", signedMsg1)

    // concatenating the signatures obtained
    const concatenatedSignature = signedMsg0 + signedMsg1.slice(2);

    console.log("Concatenated Signature - ", concatenatedSignature)

    // passing the prepared values (ethSignedMsgHash, requiredSignatures, testCheckNSignatures) to the testCheckNSignatures method which will make transaction call to the network and call the checkNSignatures function on behalf of a signer (for testing this, you can use any of the executor wallet.. )
    await testCheckNSignatures(ethSignedMsgHash, requiredSignatures, concatenatedSignature);

    // calling the return owners function from the contract to get the recovered wallet addresses that was reflected after calling the checkNSignatures function
    const checkSignersContract = new ethers.Contract("0x18684F8453b32b05c3a378D2831d2356Bf9d8d87", contractArtifact.abi, provider);
    const addresses = await checkSignersContract.returnOwners();
    console.log(addresses)

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
