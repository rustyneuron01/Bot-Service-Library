import { Connection, GetProgramAccountsFilter } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { connection, ws } from "../message";
import { mainnetRPC } from "../config";
let geyserList: string[] = [];

// Function to send a request to the WebSocket server
const sendRequest = async (inputpubkey: string) => {
  let temp: any = [];
  const pubkey: any = await getAtaList(inputpubkey);

  for (let i = 0; i < pubkey.length; i++)
    if (!geyserList.includes(pubkey[i])) {
      geyserList.push(pubkey[i]);
      temp.push(pubkey[i]);
    }

  console.log("Add to geyer list =====> ", temp);

  if (temp.length == 0) return false;

  const request = {
    jsonrpc: "2.0",
    id: 420,
    method: "transactionSubscribe",
    params: [
      {
        failed: false,
        accountInclude: temp,
      },
      {
        commitment: "finalized",
        encoding: "jsonParsed",
        transactionDetails: "full",
        maxSupportedTransactionVersion: 0,
      },
    ],
  };

  if (temp.length > 0) {
    ws.send(JSON.stringify(request));
  }

  return true;
};

export { getAtaList, sendRequest };
