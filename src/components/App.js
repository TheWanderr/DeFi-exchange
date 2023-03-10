import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Helmet } from "react-helmet";
import config from '../config.json';
import { loadProvider, loadNetwork, loadAccount, loadTokens, loadExchange, loadAllOrders, subscribeToEvents } from '../store/interactions';

import Navbar from './Navbar';
import Markets from './Markets';
import Balance from './Balance';
import Order from './Order';
import PriceChart from './PriceChart';
import Transactions from './Transactions';
import Trades from './Trades';
import OrderBook from './OrderBook';
import Alert from './Alert';

function App() {
  const dispatch = useDispatch()

  const loadBlockchainData = async () => {
    //Connect ethers to blockchain(Metamask)
    const provider = loadProvider(dispatch)

    //Fetch current networks chainId (e.g. hardhat: 31337, Goerli: 5, Sepolia: 11155111)
    const chainId = await loadNetwork(provider, dispatch)

    //Reload page when network changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload()
    })

    //Fetch current account and balance from Metamask when changed
    window.ethereum.on('accountsChanged', () => {
      loadAccount(provider, dispatch)
    })

    //Load token smart token
    const blu = config[chainId].blu
    const mETH = config[chainId].mETH
    await loadTokens(provider, [blu.address, mETH.address], dispatch)

    //Load exchange smart contract
    const exchangeConfig = config[chainId].exchange
    const exchange = await loadExchange(provider, exchangeConfig.address, dispatch)

    //Fetch all orders (open, filled and cancelled)
    loadAllOrders(provider, exchange, dispatch)

    //Listen to events
    subscribeToEvents(exchange, dispatch)
  }

  useEffect(() => {
    loadBlockchainData()
  })

  return (
    <div>

      <Helmet>
        <meta charSet="utf-8"/>
        <title>Cobolt BLU Exchange</title>
        <link rel="canonical" href="https://little-rain-9998.on.fleek.co/" />
        <meta name="description" content="Token Trade Exchange" />
      </Helmet>

      <Navbar />

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          <Markets />

          <Balance />

          <Order />

        </section>
        <section className='exchange__section--right grid'>

          <PriceChart />

          <Transactions />

          <Trades />

          <OrderBook />

        </section>
      </main>

      <Alert />

    </div>
  );
}

export default App;
