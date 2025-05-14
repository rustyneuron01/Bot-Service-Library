import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { mainMenuWaiting, outputBalance, readBundlerWallets, readJson, saveBundlerWalletsToFile, sleep } from "../src/utils";
import { cluster, connection } from "../config";
import { bundlerWalletName, bundleWalletNum } from "../settings"
import bs58 from 'bs58'
import { screen_clear } from "../menu/menu";
import { execute } from "../src/legacy";
import { createCloseAccountInstruction, getAssociatedTokenAddress, NATIVE_MINT } from "@solana/spl-token";

const walletNum = bundleWalletNum

export const sol_gather = async () => {
    screen_clear()
    console.log(`Gathering Sol from ${bundleWalletNum} bundler wallets...`);

    const savedWallets = readBundlerWallets(bundlerWalletName)
    // console.log("🚀 ~ savedWallets: ", savedWallets)

    const walletKPs = savedWallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
    const data = readJson()
    const mint = new PublicKey(data.mint!)
    const LP_wallet_keypair = Keypair.fromSecretKey(bs58.decode(data.mainKp!))
    const batchLength = 5
    const batchNum = Math.ceil(bundleWalletNum / batchLength)
    let successNum = 0

    try {
        for (let i = 0; i < batchNum; i++) {
            const sendSolTx: TransactionInstruction[] = []
            sendSolTx.push(
                ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 250_000 })
            )
            let index = 0
            while (true) {
                try {
                    if (index > 3) {
                        console.log("Error in gathering sol. Please retry gathering.")
                        mainMenuWaiting()
                        return
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
                    const signers = walletKPs.slice(i * batchLength, bundleWalletNum > (i + 1) * batchLength ? (i + 1) * batchLength : bundleWalletNum)
                    transaction.sign(signers)
                    transaction.sign([LP_wallet_keypair])
                    console.log(await connection.simulateTransaction(transaction))
                    const txSig = await execute(transaction, latestBlockhash, 1)
                    const tokenBuyTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
                    if (txSig) {
                        successNum++
                        console.log("SOL gathered ", tokenBuyTx)
                    }
                    break
                } catch (error) {
                    index++
                    console.log(error)
                }
            }
        }
        console.log("Number of successful gathering: ", successNum)
        if (successNum == batchNum) console.log("Successfully gathered sol from bundler wallets!")
    } catch (error) {
        console.log(`Failed to transfer SOL`)
    }
    await outputBalance(LP_wallet_keypair.publicKey)
    mainMenuWaiting()
}
