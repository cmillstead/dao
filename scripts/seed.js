
const hre = require("hardhat");
const config = require('../src/config.json');

const ether = (n) => {
    return hre.ethers.utils.parseEther(n.toString());
}

async function main() {
    console.log(`Fetching accounts & network...\n`);
    
    const accounts = await hre.ethers.getSigners();
    const funder = accounts[0];
    const investor1 = accounts[1];
    const investor2 = accounts[2];
    const investor3 = accounts[3];
    const recipient = accounts[4];
    let transaction;

    // fetch network
    const { chainId } = await hre.ethers.provider.getNetwork();

    console.log(`Fetching token and tranferring to accounts...\n`);
    const token = await hre.ethers.getContractAt('Token', config[chainId].token.address);
    console.log(`Token deployed to: ${token.address}\n`);
    

    transaction = await token.connect(funder).transfer(investor1.address, ether(200000));
    await transaction.wait();

    transaction = await token.connect(funder).transfer(investor2.address, ether(200000));
    await transaction.wait();

    transaction = await token.connect(funder).transfer(investor3.address, ether(200000));
    await transaction.wait();

    console.log(`Fetching DAO and sending 1000 ether to treasury...\n`);

    // fetch deployed DAO    
    const dao = await hre.ethers.getContractAt('DAO', config[chainId].dao.address);
    console.log(`DAO fetched: ${dao.address}\n`);
    
    transaction = await funder.sendTransaction({ to: dao.address, value: ether(1000) });
    await transaction.wait();
    console.log(`Sent funds to DAO treasury...\n`);

    for (var i = 0; i < 3; i++) {
        // create proposal
        transaction = await dao.connect(investor1).createProposal(`Proposal ${i + 1}`, ether(100), recipient.address);
        await transaction.wait();
        console.log(`Proposal ${i + 1} created...\n`);

        // vote
        transaction = await dao.connect(investor1).vote(i + 1);
        await transaction.wait();

        transaction = await dao.connect(investor2).vote(i + 1);
        await transaction.wait();

        transaction = await dao.connect(investor3).vote(i + 1);
        await transaction.wait();
        
         // finalize proposal
        transaction = await dao.connect(investor1).finalizeProposal(i + 1);
        await transaction.wait();

        console.log(`Proposal ${i + 1} finalized...\n`);
    }
    // Create one more proposal
    transaction = await dao.connect(investor1).createProposal(`Proposal 4`, ether(100), recipient.address)
    await transaction.wait()

    // Vote 1
    transaction = await dao.connect(investor2).vote(4)
    await transaction.wait()

    // Vote 2
    transaction = await dao.connect(investor3).vote(4)
    await transaction.wait()

    console.log(`Finished.\n`)
};


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
