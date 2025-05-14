import { AddressLookupTableProgram, ComputeBudgetProgram, Keypair, PublicKey, sendAndConfirmRawTransaction, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js"
import {
    DEVNET_PROGRAM_ID,
    jsonInfo2PoolKeys,
    Liquidity,
    MAINNET_PROGRAM_ID,
    MARKET_STATE_LAYOUT_V3, LiquidityPoolKeys,
} from "@raydium-io/raydium-sdk"
import { getAssociatedTokenAddress, getMint, NATIVE_MINT, unpackMint } from "@solana/spl-token";
import bs58 from "bs58"
import BN from "bn.js"

import { mainMenuWaiting, outputBalance, readBundlerWallets, readJson, readLUTAddressFromFile, readWallets, retrieveEnvVariable, saveDataToFile, sleep } from "../src/utils"
import {
    getTokenAccountBalance,
    assert,
    getWalletTokenAccount,
} from "../src/get_balance";
import {
    connection,
    cluster,
} from "../config";
import {
    quote_Mint_amount,
    input_baseMint_tokens_percentage,
    bundlerWalletName,
    batchSize
} from "../settings"

import { executeVersionedTx } from "../src/execute";
import { jitoWithAxios } from "../src/jitoWithAxios";
// import { createLookupTable } from "../layout/createLUT";

const programId = MAINNET_PROGRAM_ID

export async function manual_all_sell() {
    const wallets = readBundlerWallets(bundlerWalletName)
    const data = readJson()
    const lutAddress = readLUTAddressFromFile()

    const walletKPs = wallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
    const lookupTableAddress = new PublicKey(lutAddress!);
    const LP_wallet_keypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(data.mainKp!)));

    console.log("LP Wallet Address: ", LP_wallet_keypair.publicKey.toString());
        // saveDataToFile(params)

        // console.log("AMM ID: ", ammId.toString());
        // console.log("lpMint: ", lpMint.toString());

        // --------------------------------------------
        let quote_amount = quote_Mint_amount * 10 ** quoteDecimals;
        // -------------------------------------- Get balance
        let base_balance: number;
        let quote_balance: number;

        if (baseMint.toString() == "So11111111111111111111111111111111111111112") {
            base_balance = await connection.getBalance(LP_wallet_keypair.publicKey);
            if (!base_balance) return;
            // console.log("SOL Balance:", base_balance);
        } else {
            const temp = await getTokenAccountBalance(
                connection,
                LP_wallet_keypair.publicKey.toString(),
                baseMint.toString()
            );
            base_balance = temp || 0;
        }

        if (quoteMint.toString() == "So11111111111111111111111111111111111111112") {
            quote_balance = await connection.getBalance(LP_wallet_keypair.publicKey);
            if (!quote_balance) return;
            // console.log("SOL Balance:", quote_balance);
            assert(
                quote_amount <= quote_balance,
                "Sol LP input is greater than current balance"
            );
        } else {
            const temp = await getTokenAccountBalance(
                connection,
                LP_wallet_keypair.publicKey.toString(),
                quoteMint.toString()
            );
            quote_balance = temp || 0;
        }

        let base_amount_input = Math.ceil(base_balance * input_baseMint_tokens_percentage);
        console.log("Input Base: ", base_amount_input);

        let versionedTxs: VersionedTransaction[] = []

        // console.log((await connection.simulateTransaction(createPoolTransaction[0], undefined)));

        // -------------------------------------------------
        // ---- Swap info

        const targetPoolInfo = {
            id: associatedPoolKeys.id.toString(),
            baseMint: associatedPoolKeys.baseMint.toString(),
            quoteMint: associatedPoolKeys.quoteMint.toString(),
            lpMint: associatedPoolKeys.lpMint.toString(),
            baseDecimals: associatedPoolKeys.baseDecimals,
            quoteDecimals: associatedPoolKeys.quoteDecimals,
            lpDecimals: associatedPoolKeys.lpDecimals,
            version: 4,
            programId: associatedPoolKeys.programId.toString(),
            authority: associatedPoolKeys.authority.toString(),
            openOrders: associatedPoolKeys.openOrders.toString(),
            targetOrders: associatedPoolKeys.targetOrders.toString(),
            baseVault: associatedPoolKeys.baseVault.toString(),
            quoteVault: associatedPoolKeys.quoteVault.toString(),
            withdrawQueue: associatedPoolKeys.withdrawQueue.toString(),
            lpVault: associatedPoolKeys.lpVault.toString(),
            marketVersion: 3,
            marketProgramId: associatedPoolKeys.marketProgramId.toString(),
            marketId: associatedPoolKeys.marketId.toString(),
            marketAuthority: associatedPoolKeys.marketAuthority.toString(),
            marketBaseVault: marketBaseVault.toString(),
            marketQuoteVault: marketQuoteVault.toString(),
            marketBids: marketBids.toString(),
            marketAsks: marketAsks.toString(),
            marketEventQueue: marketEventQueue.toString(),
            lookupTableAccount: PublicKey.default.toString(),
        };
        // console.log("🚀 ~ txCreateNewPoolAndBundleBuy ~ targetPoolInfo:", targetPoolInfo)

        const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys;

        console.log("\n -------- Now getting swap instructions --------");

        // const TOKEN_TYPE = new Token(TOKEN_PROGRAM_ID, baseMint, baseDecimals)

        // const lookupTableAccount = (
        //     await connection.getAddressLookupTable(lookupTableAddress)
        // ).value;

        // console.log("Wallets: ", walletKPs)

        const baseInfo = await getMint(connection, baseMint)
        if (baseInfo == null) {
            return null
        }

        // const baseDecimal = baseInfo.decimals

        // const keys = await derivePoolKeys(new PublicKey(data.marketId!));

        for (let i = 0; i < 3; i++) {

            console.log("Processing transaction ", i + 1)

            const txs: TransactionInstruction[] = [];
            const ixs: TransactionInstruction[] = [
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 744_452 }),
                ComputeBudgetProgram.setComputeUnitLimit({ units: 1_183_504 })
            ]

            for (let j = 0; j < batchSize; j++) {
                
                // const walletTokenAccounts = await getWalletTokenAccount(connection, walletKPs[i * 7 + j].publicKey)

                const quoteAta = await getAssociatedTokenAddress(NATIVE_MINT, walletKPs[i * 7 + j].publicKey)
                const baseAta = await getAssociatedTokenAddress(baseMint, walletKPs[i * 7 + j].publicKey)
                const tokenBalance = (await connection.getTokenAccountBalance(baseAta)).value.amount

                const keypair = walletKPs[i * 7 + j]

                if (tokenBalance) {
                    const { innerTransaction: innerBuyIx } = Liquidity.makeSwapFixedInInstruction(
                        {
                            poolKeys: poolKeys,
                            userKeys: {
                                tokenAccountIn: baseAta,
                                tokenAccountOut: quoteAta,
                                owner: keypair.publicKey,
                            },
                            amountIn: tokenBalance,
                            minAmountOut: 0,
                        },
                        poolKeys.version,
                    );
                    ixs.push(...innerBuyIx.instructions)
                }
            }

            const lookupTable = (await connection.getAddressLookupTable(lookupTableAddress)).value;

            if(!lookupTable) {
                console.log("Error in fetching the data of the lookuptable.")
            }

            const buyRecentBlockhash = (await connection.getLatestBlockhash().catch(async () => {
                return await connection.getLatestBlockhash().catch(getLatestBlockhashError => {
                    console.log({ getLatestBlockhashError })
                    return null
                })
            }))?.blockhash;
            if (!buyRecentBlockhash) return { Err: "Failed to prepare transaction" }
            const swapVersionedTransaction = new VersionedTransaction(
                new TransactionMessage({
                    payerKey: walletKPs[i * 7].publicKey,
                    recentBlockhash: buyRecentBlockhash,
                    instructions: ixs,
                }).compileToV0Message([lookupTable!])
            );
            console.log('Transaction size with address lookuptable: ', swapVersionedTransaction.serialize().length, 'bytes');

            const signers = walletKPs.slice(i * batchSize, (i + 1) * batchSize)
            swapVersionedTransaction.sign(signers)
            // swapVersionedTransaction.sign([LP_wallet_keypair])

            console.log("-------- swap coin instructions [DONE] ---------\n")

            console.log((await connection.simulateTransaction(swapVersionedTransaction)))

            versionedTxs.push(swapVersionedTransaction)

        }

        await outputBalance(LP_wallet_keypair.publicKey)
        // swap ix end ------------------------------------------------------------

        if (cluster == "mainnet") {
            console.log("------------- Bundle & Send ---------")
            console.log("Please wait for 30 seconds for bundle to be completely executed by all nearests available leaders!");
            let result;
            while (1) {
                result = await jitoWithAxios(versionedTxs, LP_wallet_keypair)
                if (result.confirmed) {
                    console.log("Bundle signature: ", result.jitoTxsignature)
                    break;
                }
            }
        }

        console.log("------------- Bundle Successfully done ----------");
        mainMenuWaiting()
    }
}