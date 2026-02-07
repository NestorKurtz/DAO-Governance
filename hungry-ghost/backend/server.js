/**
 * Hungry Ghosts – minimal API
 * Health, config, and future treasury/accounting endpoints.
 */
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5175

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'hungry-ghost-api',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/config', (req, res) => {
  res.json({
    chainId: process.env.POLYGON_CHAIN_ID || 137,
    ghstAddress: process.env.GHST_ADDRESS || null,
    ghoAddress: process.env.GHO_ADDRESS || null,
    stakingContractAddress: process.env.STAKING_CONTRACT_ADDRESS || null,
  })
})

app.listen(PORT, () => {
  console.log(`Hungry Ghosts API running on port ${PORT}`)
})
