import { useState, useEffect } from 'react'

const POLYGON_CHAIN_ID = 137
const POLYGON_RPC = 'https://polygon-rpc.com'

function WalletConnect({ account, onAccountChange, onChainIdChange, targetChainId }) {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        onAccountChange?.(accounts.length > 0 ? accounts[0] : null)
      })
      .catch(() => {})
    window.ethereum
      .request({ method: 'eth_chainId' })
      .then((id) => onChainIdChange?.(Number(id)))
      .catch(() => {})
  }, [onAccountChange, onChainIdChange])

  const connect = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask')
      return
    }
    setConnecting(true)
    setError(null)
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      onAccountChange?.(accounts[0] ?? null)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      onChainIdChange?.(Number(chainId))
      if (Number(chainId) !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          })
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${targetChainId.toString(16)}`,
                  chainName: 'Polygon',
                  rpcUrls: [POLYGON_RPC],
                },
              ],
            })
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to connect')
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = () => {
    onAccountChange?.(null)
  }

  if (!window.ethereum) {
    return (
      <a
        href="https://metamask.io"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '0.5rem 1rem',
          background: '#2a2a35',
          borderRadius: '8px',
          color: '#e0e0e0',
          textDecoration: 'none',
        }}
      >
        Install MetaMask
      </a>
    )
  }

  if (account) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
        <button
          onClick={disconnect}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid #2a2a35',
            borderRadius: '8px',
            color: '#e0e0e0',
            cursor: 'pointer',
          }}
        >
          {`${account.slice(0, 6)}...${account.slice(-4)}`}
        </button>
        {error && <span style={{ fontSize: '0.75rem', color: '#f66' }}>{error}</span>}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={connect}
        disabled={connecting}
        style={{
          padding: '0.5rem 1rem',
          background: '#8b8bff',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          cursor: connecting ? 'wait' : 'pointer',
        }}
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && <div style={{ fontSize: '0.75rem', color: '#f66', marginTop: '0.25rem' }}>{error}</div>}
    </div>
  )
}

export default WalletConnect
