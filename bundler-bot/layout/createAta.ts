import bs58 from "bs58"
import { AddressLookupTableProgram, ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SignatureStatus, SystemProgram, Transaction, TransactionConfirmationStatus, TransactionInstruction, TransactionMessage, TransactionSignature, VersionedTransaction } from "@solana/web3.js"
import { cluster, connection } from "../config";
import { mainMenuWaiting, outputBalance, readBundlerWallets, readJson, readSwapAmounts, saveLUTAddressToFile, sleep } from "../src/utils";
import { bundlerWalletName } from "../settings";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID, unpackMint } from "@solana/spl-token";
import { DEVNET_PROGRAM_ID, Liquidity, MAINNET_PROGRAM_ID, MARKET_STATE_LAYOUT_V3 } from "@raydium-io/raydium-sdk";
import { derivePoolKeys } from "../src/poolAll";

const data = readJson()
const SIGNER_WALLET = Keypair.fromSecretKey(bs58.decode(data.mainKp!))

async function confirmTransaction(
    connection: Connection,
    signature: TransactionSignature,
    desiredConfirmationStatus: TransactionConfirmationStatus = 'confirmed',
    timeout: number = 30000,
    pollInterval: number = 1000,
    searchTransactionHistory: boolean = false
): Promise<SignatureStatus> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const { value: statuses } = await connection.getSignatureStatuses([signature], { searchTransactionHistory });

        if (!statuses || statuses.length === 0) {
            throw new Error('Failed to get signature status');
        }

        const status = statuses[0];

        if (status === null) {
            // If status is null, the transaction is not yet known
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            continue;
        }

        if (status.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
        }

        if (status.confirmationStatus && status.confirmationStatus === desiredConfirmationStatus) {
            return status;
        }

        if (status.confirmationStatus === 'finalized') {
            return status;
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
}

async function createLUT() {
    try {
        const [lookupTableInst, lookupTableAddress] =
            AddressLookupTableProgram.createLookupTable({
                authority: SIGNER_WALLET.publicKey,
                payer: SIGNER_WALLET.publicKey,
                recentSlot: await connection.getSlot(),
            });

        // Step 2 - Log Lookup Table Address
        console.log("Lookup Table Address:", lookupTableAddress.toBase58());

        // Step 3 - Generate a create transaction and send it to the network
        createAndSendV0Tx([lookupTableInst]);
        console.log("Lookup Table Address created successfully!")
        console.log("Please wait for about 15 seconds...")
        await sleep(30000)
        return lookupTableAddress
    } catch (err) {
        console.log("Error in creating Lookuptable. Please retry this.")
        return
    }

}

async function addAddressesToTable(LOOKUP_TABLE_ADDRESS: PublicKey, mint: PublicKey) {
    const programId = MAINNET_PROGRAM_ID

    const wallets = readBundlerWallets(bundlerWalletName)

    const walletKPs: Keypair[] = wallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
    const walletPKs: PublicKey[] = wallets.map((wallet: string) => (Keypair.fromSecretKey(bs58.decode(wallet))).publicKey);
{
        await createAndSendV0Tx([addAddressesInstruction4]);
        console.log("Successfully added poolkeys addresses.")
        await sleep(10000)

        console.log("Lookup Table Address extended successfully!")
        console.log(`Lookup Table Entries: `, `https://explorer.solana.com/address/${LOOKUP_TABLE_ADDRESS.toString()}/entries`)
    }
    catch (err) {
        console.log("There is an error in adding addresses in LUT. Please retry it.")
        mainMenuWaiting()
        return;
    }
}

const createAtas = async (wallets: Keypair[], baseMint: PublicKey) => {

    const swapSolAmount = readSwapAmounts()

    try {
        let successTxNum = 0
        wallets.map((async (wallet, i) => {
            await sleep(1000 * i)
            const quoteAta = await getAssociatedTokenAddress(NATIVE_MINT, wallet.publicKey)
            const baseAta = await getAssociatedTokenAddress(baseMint, wallet.publicKey)

        }))
        console.log("Waiting for ata creation result")
        await sleep(60000)
        console.log("Successful ata creation for ", successTxNum, " wallets")
        if (successTxNum === wallets.length) {
            console.log("Ata creation finished")
            return
        } else {
            console.log(wallets.length - successTxNum, " tx failed, try again")
        }
    } catch (error) {
        console.log("Prepare Ata creation error:", error)
        return
    }
}

export const create_atas = async () => {

    const wallets = readBundlerWallets(bundlerWalletName)
    const walletKPs = wallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
    const data = readJson()
    const mint = new PublicKey(data.mint!)

    try {
        await outputBalance(SIGNER_WALLET.publicKey)

        console.log("Creating associated token accounts.")
        await createAtas(walletKPs, mint)

        await outputBalance(SIGNER_WALLET.publicKey)
        mainMenuWaiting()
    } catch (err) {
        console.log("Error occurred in creating lookuptable. Please retry this again.")
        mainMenuWaiting()
    }

}