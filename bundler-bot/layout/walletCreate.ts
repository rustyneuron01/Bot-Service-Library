import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { newSendToken } from "../src/sendBulkToken";
import { Data, mainMenuWaiting, readBundlerWallets, readJson, saveBundlerWalletsToFile, saveHolderWalletsToFile, saveSwapSolAmountToFile, sleep } from "../src/utils";
import { connection } from "../config";
import { bundlerWalletName, bundleWalletNum, needNewWallets, swapSolAmountMax, swapSolAmountMin } from "../settings"
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import bs58 from 'bs58'
import { screen_clear } from "../menu/menu";
import { execute } from "../src/legacy";

const walletNum = bundleWalletNum

export const wallet_create = async () => {
  screen_clear()
  console.log(`Creating ${walletNum} Wallets for bundle buy`);

  let solAmountArray: number[] = []
  let wallets: string[] = []

  if (needNewWallets) {
    // Step 1 - creating bundler wallets
    try {
      for (let i = 0; i < bundleWalletNum; i++) {
        const newWallet = Keypair.generate()
        wallets.push(bs58.encode(newWallet.secretKey))
        solAmountArray.push(Number((Math.random() * (swapSolAmountMax - swapSolAmountMin) + swapSolAmountMin).toFixed(4)))
      }
      saveBundlerWalletsToFile(
        wallets, bundlerWalletName
      )
      saveSwapSolAmountToFile(
        solAmountArray
      )
      await sleep(2000)
    } catch (error) { console.log(error) }
    console.log("🚀 ~ Bundler wallets: ", wallets)
  }

  const savedWallets = readBundlerWallets(bundlerWalletName)
  // console.log("🚀 ~ savedWallets: ", savedWallets)

  // Step 2 - distributing sol to bundler wallets
  console.log("Distributing sol to bundler wallets...")

  const walletKPs = savedWallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
  const data = readJson()
  const LP_wallet_keypair = Keypair.fromSecretKey(bs58.decode(data.mainKp!))
  const batchLength = 15
  const batchNum = Math.ceil(bundleWalletNum / batchLength)

  try {
    for (let i = 0; i < batchNum; i++) {
      const sendSolTx: TransactionInstruction[] = []
      sendSolTx.push(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 550_000 })
      )
      for (let j = 0; j < batchLength; j++) {

        if ((i * batchLength + j) >= bundleWalletNum) continue;
        sendSolTx.push(
          SystemProgram.transfer({
            fromPubkey: LP_wallet_keypair.publicKey,
            toPubkey: walletKPs[i * batchLength + j].publicKey,
            lamports: (solAmountArray[i * batchLength + j] + 0.01) * LAMPORTS_PER_SOL
          })
        )
      }
      let index = 0
      while (true) {
        try {
          if (index > 3) {
            console.log("Error in distribution")
            return null
          }
          const siTx = new Transaction().add(...sendSolTx)
          const latestBlockhash = await connection.getLatestBlockhash()
          siTx.feePayer = LP_wallet_keypair.publicKey
          siTx.recentBlockhash = latestBlockhash.blockhash
          const messageV0 = new TransactionMessage({
            payerKey: LP_wallet_keypair.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: sendSolTx,
          }).compileToV0Message()
          const transaction = new VersionedTransaction(messageV0)
          transaction.sign([LP_wallet_keypair])
          const txSig = await execute(transaction, latestBlockhash, 1)
          const tokenBuyTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
          console.log("SOL distributed ", tokenBuyTx)
          break
        } catch (error) {
          index++
        }
      }
    }
    console.log("Successfully distributed sol to bundler wallets!")
  } catch (error) {
    console.log(`Failed to transfer SOL`)
  }

  mainMenuWaiting()
}
