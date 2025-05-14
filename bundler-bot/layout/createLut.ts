import bs58 from "bs58"
import { AddressLookupTableProgram, ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SignatureStatus, SystemProgram, Transaction, TransactionConfirmationStatus, TransactionInstruction, TransactionMessage, TransactionSignature, VersionedTransaction } from "@solana/web3.js"
import { cluster, connection } from "../config";
import { mainMenuWaiting, outputBalance, readBundlerWallets, readJson, saveLUTAddressToFile, sleep } from "../src/utils";
import { bundlerWalletName } from "../settings";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID, unpackMint } from "@solana/spl-token";
import { DEVNET_PROGRAM_ID, Liquidity, MAINNET_PROGRAM_ID, MARKET_STATE_LAYOUT_V3 } from "@raydium-io/raydium-sdk";
import { derivePoolKeys } from "../src/poolAll";

const data = readJson()
const SIGNER_WALLET = Keypair.fromSecretKey(bs58.decode(data.mainKp!))

export const createAndSendV0Tx = async (txInstructions: TransactionInstruction[]) => {
    // Step 1 - Fetch Latest Blockhash
    let latestBlockhash = await connection.getLatestBlockhash();
}

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


        const {
            baseMint,
            quoteMint,
            baseVault: marketBaseVault,
            quoteVault: marketQuoteVault,
            bids: marketBids,
            asks: marketAsks,
            eventQueue: marketEventQueue
        } = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo.data);

        const accountInfo_base = await connection.getAccountInfo(baseMint);
        // console.log("🚀 ~ txCreateNewPoolAndBundleBuy ~ accountInfo_base:", accountInfo_base)
        if (!accountInfo_base) return;
        const baseTokenProgramId = accountInfo_base.owner;
        const baseDecimals = unpackMint(
            baseMint,
            accountInfo_base,
            baseTokenProgramId
        ).decimals;
        // console.log("Base Decimals: ", baseDecimals);

        const accountInfo_quote = await connection.getAccountInfo(quoteMint);
        // console.log("🚀 ~ txCreateNewPoolAndBundleBuy ~ accountInfo_quote:", accountInfo_quote)
        if (!accountInfo_quote) return;
        const quoteTokenProgramId = accountInfo_quote.owner;
        const quoteDecimals = unpackMint(
            quoteMint,
            accountInfo_quote,
            quoteTokenProgramId
        ).decimals;
        // console.log("Quote Decimals: ", quoteDecimals);

        const associatedPoolKeys = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            baseMint,
            quoteMint,
            baseDecimals,
            quoteDecimals,
            marketId: new PublicKey(data.marketId!),
            programId: programId.AmmV4,
            marketProgramId: programId.OPENBOOK_MARKET,
        });

    }
    catch (err) {
        console.log("There is an error in adding addresses in LUT. Please retry it.")
        mainMenuWaiting()
        return;
    }
}

export const create_extend_lut = async () => {

    const wallets = readBundlerWallets(bundlerWalletName)
    const walletKPs = wallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
    const data = readJson()
    const mint = new PublicKey(data.mint!)
    
    try {
        console.log("Creating Address LookUpTable for our bundler.")
        await outputBalance(SIGNER_WALLET.publicKey)

        
        mainMenuWaiting()
    } catch (err) {
        // console.log("Error occurred in creating lookuptable. Please retry this again.")
        mainMenuWaiting()
    }

}