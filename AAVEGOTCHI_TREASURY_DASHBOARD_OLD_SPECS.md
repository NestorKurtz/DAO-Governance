# Aavegotchi DAO Treasury Dashboard

This project aims to create a dashboard to track Aavegotchi DAO's income and assets. The dashboard will provide an overview of the DAO's total assets and income, break down assets by type, and track income over time. The dashboard may be built in Dune and/or other reporting tools.

Overall, the dashboard should provide an easy-to-understand snapshot of the Aavegotchi DAO's financial health and activity, allowing stakeholders to make informed decisions about the DAO's operations and governance.

The dashboard should provide an overview of the Aavegotchi DAO's total assets and income for a given period. This should include the total value of all relevant income and assets held by the DAO as outlined below.

The dashboard should take into account the latest 365 days of transaction history. 

## Income

Include the income sources below. Display an overall summary of income (total and broken down by source) for the past 7 days, 30 days, and 365 days. Include time series charts of income by source broken down by week and month.

- **Alchemica earned from Gotchiverse Crafting**  
  Example Transaction (Installation)  
  Contract: `0x19f870bd94a34b3adaa9caa439d333da18d6812a`  
  Example Transaction (Tile)  
  Contract: `0x9216c31d8146bcb3ea5a9162dc1702e8aedca355`

- **GHST earned from Baazaar Fees**  
  Example Transaction  
  Contract: `0x86935f11c86623dec8a25696e1c19a8659cbf95d`

- **GHST earned from GBM Auctions**  
  Example Transaction  
  Contract: `0xD5543237C656f25EEA69f1E247b8Fa59ba353306`

- **Alloy Earned from Forge Smelting**  
  Example Transaction  
  Contract: `0x4fdfc1b53fd1d80d969c984ba7a8ce4c7baad442`

## Assets

Include the assets below. Display an overall summary of current assets (total and broken down by wallet). Include charts showing change in asset balances by the end of each week and month.

- **GHST**  
  - Polygon: `0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7`  
  - Ethereum: `0x3F382DbD960E3a9bbCeaE22651E88158d2791550`

- **DAI**  
  - Polygon: `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063`  
  - Ethereum: `0x6B175474E89094C44Da98b954EedeAC495271d0F`

- **USDC**  
  - Polygon: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`  
  - Ethereum: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

- **Alchemica**  
  - FUD: `0x403E967b044d4Be25170310157cB1A4Bf10bdD0f`  
  - FOMO: `0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8`  
  - ALPHA: `0x6a3e7c3c6ef65ee26975b12293ca1aad7e1daed2`  
  - KEK: `0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C`

- **Alloy (ERC1155)**  
  - Contract: `0x4fDfc1B53Fd1D80d969C984ba7a8CE4c7bAaD442`  
  - Token ID: `1000000000`

- **Matic**

- **Other Assets**  
  Show the DAO-owned liquidity and the current token balances.

  - Balancer Liquidity Pool (transaction)  
  - Quickswap Liquidity Mining (loan) - 160K GHST

## DAO Addresses

Here are addresses that are relevant for determining income and assets:

- `0xb208f8BB431f580CC4b216826AFfB128cd1431aB`  
  OG Polygon Treasury  
  Gotchiverse Crafting  
  Baazaar Fees

- `0x27DF5C6dcd360f372e23d5e63645eC0072D0C098`  
  Rarity Farming Rewards

- `0x6fb7e0AAFBa16396Ad6c1046027717bcA25F821f`  
  DTF Wallet - currently alloy from The Forge is being sent here

- `0x53c3CA81EA03001a350166D2Cc0fcd9d4c1b7B62`  
  DAO Foundation Treasury (Ethereum)

- `0x854dfAAb274E756f8e792E42AdA416786548FA07`  
  DAO Foundation Liquidity (Ethereum)

- `0x578580F4700A9721Eb965B151Ac0941fa2afcC6c`  
  DAO Foundation Rewards (Ethereum)

- `0x939b67F6F6BE63E09B0258621c5A24eecB92631c`  
  DAO Foundation Treasury (Polygon)

- `0x62DE034b1A69eF853c9d0D8a33D26DF5cF26682E`  
  DAO Foundation Liquidity (Polygon)

- `0x8c8E076Cd7D2A17Ba2a5e5AF7036c2b2B7F790f6`  
  DAO Foundation Rewards (Polygon)

- `0xFFE6280ae4E864D9aF836B562359FD828EcE8020`  
  Curve Fees (Ethereum)

- `0xfB76E9be55758d0042e003c1E46E186360F0627e`  
  The Curve (Ethereum) - RIP

- `0x48eA1d45142fC645fDcf78C133Ac082eF159Fe14`  
  Gotchiverse Player Rewards

- `0xAbA69f6E893B18bE066a237f723F43315BBF9D9A`  
  USDC -> GHST Swapper (swaps USDC to GHST and sends GHST to DAO Foundation Rewards wallet)

## Other Non-DAO Wallets for Reference Only

- `0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64`  
  Pixelcraft Earnings Wallet - alte Specs für das Treasury Dashboard

