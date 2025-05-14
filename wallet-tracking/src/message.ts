import WebSocket from "ws";
import { bot, DEV_DEBUG, FILTER_TOKEN, geyserRPC, mainnetRPC } from "./config";
import { getAtaList, sendRequest } from "./utils/monitor";
import { abbrAddr, getUniqueWalletAddresses, readJson } from "./utils";
import { getTxInfo } from "./api";
import { Connection } from "@solana/web3.js";
import { bodyToMsg, titleToMsg } from "./utils/msg";

const ws = new WebSocket(geyserRPC);
const connection = new Connection(mainnetRPC);

let last_tx: string;
ws.on("open", async function open() {
  console.log(" == web socket is opend == ");
  //	@ts-ignore
  const allUserState: string[] = await getUniqueWalletAddresses();

  if (allUserState.length != 0) {
    allUserState.forEach(async (element: any) => {
      await sendRequest(element);
    });
  }
});

ws.on("message", async function incoming(data: any) {
  console.log(" ==> socket message received <== ");
  const messageStr = data.toString("utf8");

  try {
    const messageObj = JSON.parse(messageStr);

    const result = messageObj.params.result;
    const logs = result.transaction.meta.logMessages;
    const signature = result.signature; // Extract the signature
    const accountKeys = result.transaction.transaction.message.accountKeys.map(
      (ak: any) => ak.pubkey
    ); // Extract only pubkeys
    const timestamp = result.slot;

    console.log("============", result.slot);

    if (last_tx == signature) return;
    else last_tx = signature;

    console.log("========================================");
    console.log(signature);

    const data = await getTxInfo(signature);

    const walletList: any = readJson();
  } catch (err) {}
});

export { ws, connection };
