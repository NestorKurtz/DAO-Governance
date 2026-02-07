import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]

function TokenBalance({ account, tokenAddress, symbol, chainId }) {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!account || !tokenAddress || tokenAddress === ethers.ZeroAddress) {
      setBalance(null)
      setLoading(false)
      return
    }
    if (!window.ethereum) {
      setError('No wallet')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const provider = new ethers.BrowserProvider(window.ethereum)
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    contract
      .balanceOf(account)
      .then((bn) => {
        const decimals = 18
        const formatted = ethers.formatUnits(bn, decimals)
        setBalance(formatted)
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch')
      })
      .finally(() => setLoading(false))
  }, [account, tokenAddress, chainId])

  return (
    <div className="balance-card">
      <h3>{symbol}</h3>
      {loading && <div className="amount">...</div>}
      {error && <div className="amount" style={{ color: '#f66' }}>{error}</div>}
      {!loading && !error && balance !== null && (
        <div className="amount">
          {Number(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}
        </div>
      )}
    </div>
  )
}

export default TokenBalance
