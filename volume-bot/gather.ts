import base58 from "bs58"
import { readJson, retrieveEnvVariable, sleep } from "./src/utils"
import { ComputeBudgetProgram, Connection, Keypair, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createCloseAccountInstruction, createTransferCheckedInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { SPL_ACCOUNT_LAYOUT, TokenAccount } from "@raydium-io/raydium-sdk";

const rpcUrl = retrieveEnvVariable("RPC_URL");
const mainKpStr = retrieveEnvVariable('MAIN_KP');
const connection = new Connection(rpcUrl, { commitment: "processed" });
const mainKp = Keypair.fromSecretKey(base58.decode(mainKpStr))


const main = async () => {
  const walletsStr = readJson()
  const wallets = walletsStr.map(walletStr => Keypair.fromSecretKey(base58.decode(walletStr)))
  wallets.map(async (kp, i) => {
    try {
      await sleep(i * 100)
      const accountInfo = await connection.getAccountInfo(kp.publicKey)

      const tokenAccounts = await connection.getTokenAccountsByOwner(kp.publicKey, {
        programId: TOKEN_PROGRAM_ID,
      },
        "confirmed"
      )

    } catch (error) {
      console.log("transaction error : ", error)
      return
    }
  })
}

main()