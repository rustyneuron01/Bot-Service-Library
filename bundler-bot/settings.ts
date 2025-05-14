import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { UserToken } from './src/types';

// **************************************************** //
// ***************   SETTINGS   *********************** //
// **************************************************** //
// SD, You should set following values before you run the program.

// settings about token you are going to Mint
export const tokens: UserToken[] = [
  {
    name: 'Arabi Dogecoin',
    symbol: 'Arbct',
    decimals: 9,
    description: "This is theP's ct",
    uiAmount: 10 ** 9,
    image: "./src/images/2.jpg",
    
    extensions: {
      website: "https://www.soldev.app/",
      twitter: "https://x.com/mklrwt013",
      telegram: "https://t.me/Tiffanystones"
    },
    tags: [
      "Meme",
      "Tokenization"
    ],
    creator: {
      name: "Takhi",
      site: "https://www.soldev.app/"
    }
  }
]

// Main wallet to create token and pool, and so on
export const LP_wallet_private_key = "";
export const LP_wallet_keypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(LP_wallet_private_key)));

// amount of baseToken to put into the pool (0.5 is 50%, 1 is 100%)
export const input_baseMint_tokens_percentage = 1 //ABC-Mint amount of tokens you want to add in Lp e.g. 1 = 100%. 0.9= 90%

// amount of Sol to put into the Pool as liquidity
export let quote_Mint_amount =  0.01; //COIN-SOL, amount of SOL u want to add to Pool amount

// Max amount of Sol to bundle buy with bundler wallets (0.01 is 0.01sol)
export const swapSolAmountMax =  0.0002;

// Min amount of Sol to bundle buy with bundler wallets (0.01 is 0.01sol)
export const swapSolAmountMin =  0.0001;

// number of wallets in each transaction
export const batchSize = 7

// number of wallets to bundle buy
export const bundleWalletNum = batchSize * 3

// name of file to save bundler wallets
export const bundlerWalletName = "wallets"

// percent of LP tokens to burn
export const burnLpQuantityPercent = 100   // 70 is 70% of total lp token supply

// whether you distribute the sol to existing wallets or new wallets
export const needNewWallets = true