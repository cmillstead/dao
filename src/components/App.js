import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';
import Create from './Create';
import Proposals from './Proposals';

import DAO_ABI from '../abis/DAO.json'
import config from '../config.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [dao, setDAO] = useState(null);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [account, setAccount] = useState(null);
  const [proposals, setProposals] = useState(null);
  const [quorum, setQuorum] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    // initiatite contracts
    const dao = new ethers.Contract(config[31337].dao.address, DAO_ABI, provider);
    setDAO(dao);

    // Fetch treasury balance
    let treasuryBalance = await provider.getBalance(dao.address);
    treasuryBalance = ethers.utils.formatEther(treasuryBalance);
    setTreasuryBalance(treasuryBalance);

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);

    const count = await dao.proposalCount();
    const items = [];

    for (var i = 0; i < count; i++) {
      const proposal = await dao.proposals(i + 1);
      items.push(proposal);
     
    }
    setProposals(items);

    // Fetch DAO data
    setQuorum(await dao.quorum());

    setIsLoading(false);
  };

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData();
    }
  }, [isLoading]);

  return(
    <Container>
      <Navigation account={account} />

      <h1 className='my-4 text-center'>Welcome to our DAO!</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Create 
            provider={provider} 
            dao={dao} 
            setIsLoading={setIsLoading} 
          />
          <hr />
            <p className='text-center'><strong>Treasury Balance:</strong> {treasuryBalance} ETH</p>
          <hr />
          <Proposals 
            provider={provider} 
            dao={dao} 
            proposals={proposals} 
            quorum={quorum} 
            setIsLoading={setIsLoading}   
          />
        </>
      )}
    </Container>
  )
}

export default App;
