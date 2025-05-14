import {
  PublicKey, Keypair, Connection, Transaction, ComputeBudgetProgram,
  sendAndConfirmTransaction, VersionedTransaction, TransactionMessage,
  TransactionInstruction, SystemProgram,
} from "@solana/web3.js";
import {
  NATIVE_MINT, TOKEN_PROGRAM_ID, createTransferCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction, getAssociatedTokenAddress, getMint, getMinimumBalanceForRentExemptAccount,
  createSyncNativeInstruction
} from "@solana/spl-token";
import base58 from "bs58";
import { retrieveEnvVariable, saveDataToFile, sleep } from "./src/utils";
import { bundle } from "./src/jito";
import { Liquidity, LiquidityPoolKeysV4, MAINNET_PROGRAM_ID, InstructionType, Percent, CurrencyAmount, Token, SOL, LiquidityPoolInfo } from "@raydium-io/raydium-sdk";
import { derivePoolKeys } from "./src/poolAll";
import fs from 'fs'
import path from 'path'
import { lookupTableProvider } from "./src/lut";
import { BN } from "bn.js";

// Environment Variables3
const baseMintStr = retrieveEnvVariable('BASE_MINT');
const mainKpStr = retrieveEnvVariable('MAIN_KP');
const rpcUrl = retrieveEnvVariable("RPC_URL");
const isJito: boolean = retrieveEnvVariable("IS_JITO") === "true";
let buyMax = Number(retrieveEnvVariable('SOL_BUY_MAX'));
let buyMin = Number(retrieveEnvVariable('SOL_BUY_MIN'));
let interval = Number(retrieveEnvVariable('INTERVAL'));
const jito_tx_interval = Number(retrieveEnvVariable('JITO_TX_TIME_INTERVAL')) > 10 ?
  Number(retrieveEnvVariable('JITO_TX_TIME_INTERVAL')) : 10
const makerNum = Number(retrieveEnvVariable('WALLET_NUM'));
const poolId = retrieveEnvVariable('POOL_ID');


// Solana Connection and Keypair
const connection = new Connection(rpcUrl, { commitment: "processed" });
const mainKp = Keypair.fromSecretKey(base58.decode(mainKpStr));
const baseMint = new PublicKey(baseMintStr);

let poolKeys: LiquidityPoolKeysV4 | null = null;
let tokenAccountRent: number | null = null;
let decimal: number | null = null;
let poolInfo: LiquidityPoolInfo | null = null;

let maker = 0
let now = Date.now()
let unconfirmedKps: Keypair[] = []

/**
 * Executes a buy and sell transaction for a given token.
 * @param {PublicKey} token - The token's public key.
 */
const buySellToken = async (token: PublicKey, newWallet: Keypair) => {
  try {
    if (!tokenAccountRent)
      tokenAccountRent = await getMinimumBalanceForRentExemptAccount(connection);
    if (!decimal)
      decimal = (await getMint(connection, token)).decimals;
    if (!poolKeys) {
      poolKeys = await derivePoolKeys(new PublicKey(poolId))
      if (!poolKeys) {
        console.log("Pool keys is not derived")
        return
      }
    }

    const solBuyAmountLamports = Math.floor((Math.random() * (buyMax - buyMin) + buyMin) * 10 ** 9);
    // const solBuyAmountLamports = Math.floor((0.0005) * 10 ** 9);
    const quoteAta = await getAssociatedTokenAddress(NATIVE_MINT, mainKp.publicKey);
    const baseAta = await getAssociatedTokenAddress(token, mainKp.publicKey);
    const newWalletBaseAta = await getAssociatedTokenAddress(token, newWallet.publicKey);
    const newWalletQuoteAta = await getAssociatedTokenAddress(NATIVE_MINT, newWallet.publicKey);

    const slippage = new Percent(100, 100);
    const inputTokenAmount = new CurrencyAmount(SOL, solBuyAmountLamports);
    const outputToken = new Token(TOKEN_PROGRAM_ID, baseMint, decimal);

    if (confirmation.value.err) {
      console.log("Confrimtaion error")
      return newWallet
    } else {
      maker++
      console.log(`Buy and sell transaction: https://solscan.io/tx/${sig} and maker is ${maker}`);
    }
  } catch (error) {
    console.log("🚀 ~ buySellToken ~ error:", error)
  }
};

/**
 * Wraps the given amount of SOL into WSOL.
 * @param {Keypair} mainKp - The central keypair which holds SOL.
 * @param {number} wsolAmount - The amount of SOL to wrap.
 */
const wrapSol = async (mainKp: Keypair, wsolAmount: number) => {
  try {
    const wSolAccount = await getAssociatedTokenAddress(NATIVE_MINT, mainKp.publicKey);
    const baseAta = await getAssociatedTokenAddress(baseMint, mainKp.publicKey);
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 461_197 }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 51_337 }),
    );
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    tx.feePayer = mainKp.publicKey
    // console.log("Wrap simulation: ", await connection.simulateTransaction(tx))
    const sig = await sendAndConfirmTransaction(connection, tx, [mainKp], { skipPreflight: true, commitment: "confirmed" });
    console.log(`Wrapped SOL transaction: https://solscan.io/tx/${sig}`);
    await sleep(5000);
  } catch (error) {
    console.error("wrapSol error:", error);
  }
};

/**
 * Unwraps WSOL into SOL.
 * @param {Keypair} mainKp - The main keypair.
 */
const unwrapSol = async (mainKp: Keypair) => {
  const wSolAccount = await getAssociatedTokenAddress(NATIVE_MINT, mainKp.publicKey);
  try {
    const wsolAccountInfo = await connection.getAccountInfo(wSolAccount);
    if (wsolAccountInfo) {
      console.log(`Unwrapped SOL transaction: https://solscan.io/tx/${sig}`);
      await sleep(5000);
    }
  } catch (error) {
    console.error("unwrapSol error:", error);
  }
};

/**
 * Main function to run the maker bot.
 */
const run = async () => {

  console.log("main keypair, ", mainKp.publicKey.toBase58())
  console.log("main keypair balance : ", await connection.getBalance(mainKp.publicKey))
  const quoteAta = await getAssociatedTokenAddress(NATIVE_MINT, mainKp.publicKey);
  const baseAta = await getAssociatedTokenAddress(baseMint, mainKp.publicKey);
  if (!await connection.getAccountInfo(quoteAta) || !await connection.getAccountInfo(baseAta)) {
    await wrapSol(mainKp, 3 * buyMax);
  }

  now = Date.now()
  const waitingLines = []
  const multiNum = Math.ceil(makerNum / 20)
  for (let i = 0; i < multiNum; i++)
    waitingLines.push(i)
  waitingLines.map(async (i) => {
    await sleep(20 * interval * i)
    const kps: Keypair[] = []
    const transaction = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 20_000 }),
    )
  })

  unwrapSol(mainKp)
};

// Main function that runs the bot
run();
