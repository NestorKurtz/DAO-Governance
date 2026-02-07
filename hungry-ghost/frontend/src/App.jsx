import { useState, useEffect } from 'react'
import WalletConnect from './components/WalletConnect'
import TokenBalance from './components/TokenBalance'
import './App.css'

// Polygon mainnet token addresses (placeholders - override via VITE_*)
const GHST_ADDRESS = import.meta.env.VITE_GHST_ADDRESS || '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7'
const GHO_ADDRESS = import.meta.env.VITE_GHO_ADDRESS || '0x0000000000000000000000000000000000000000'
const POLYGON_CHAIN_ID = 137

function App() {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)

  const handleAccountsChanged = (accounts) => {
    setAccount(accounts.length > 0 ? accounts[0] : null)
  }

  const handleChainChanged = (newChainId) => {
    setChainId(Number(newChainId))
  }

  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Hungry Ghosts</h1>
          <span className="badge experimental">Experimental</span>
        </div>
        <WalletConnect
          account={account}
          onAccountChange={setAccount}
          onChainIdChange={setChainId}
          targetChainId={POLYGON_CHAIN_ID}
        />
      </header>

      {account && (
        <div className="balance-grid">
          <TokenBalance
            account={account}
            tokenAddress={GHST_ADDRESS}
            symbol="GHST"
            chainId={chainId}
          />
          <TokenBalance
            account={account}
            tokenAddress={GHO_ADDRESS}
            symbol="GHO"
            chainId={chainId}
          />
        </div>
      )}

      {!account && (
        <p style={{ color: '#888', textAlign: 'center', marginTop: '2rem' }}>
          Connect your wallet to view GHST and GHO balances.
        </p>
      )}
    </div>
  )
}

export default App
