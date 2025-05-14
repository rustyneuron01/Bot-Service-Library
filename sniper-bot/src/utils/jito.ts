import { Blockhash, Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import base58 from "bs58";
import axios from "axios";



export const executeJitoTx = async (transactions: VersionedTransaction[], payer: Keypair, commitment: Commitment, latestBlockhash: any) => {
  const JITO_FEE = Number(process.env.JITO_FEE);
  if(!JITO_FEE) return console.log('Jito fee has not been set!');
  const RPC_ENDPOINT = process.env.RPC_ENDPOINT;
  if(!RPC_ENDPOINT) return console.log("Rpc has not been set!")
  const solanaConnection = new Connection(RPC_ENDPOINT)

    if (successfulResults.length > 0) {
      console.log(`Successful response`);
      console.log(`Confirming jito transaction...`);

      const confirmation = await solanaConnection.confirmTransaction(
        {
          signature: jitoTxsignature,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          blockhash: latestBlockhash.blockhash,
        },
        commitment,
      );
      console.log("🚀 ~ executeJitoTx ~ confirmation:", confirmation)

      if (confirmation.value.err) {
        console.log("Confirmtaion error")
        return null
      } else {
        return jitoTxsignature;
      }
    } else {
      console.log(`No successful responses received for jito`);
    }
    console.log("case 1")
    return null
  } catch (error) {
    console.log('Error during transaction execution', error);
    return null
  }
}




