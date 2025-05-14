import { bot, mainnetRPC } from "./config";
import * as commands from "./commands";
import { INPUT_ACTION } from "./type";
import { addWallet, readWallet, removeWallet } from "./utils/wallets";
import { PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { addToken, delToken, readToken } from "./utils";
import { connection } from "./message";
import { sendRequest } from "./utils/monitor";
import { addWalletAlias } from "./utils/wallets_alias";

let botName;
let input_state: any = {};
let temp_token_list: any = {};

const start = async () => {
  console.log("Wallet Tracker is running since now");

  bot.getMe().then((user: any) => {
    botName = user.username!.toString();
  });

  bot.setMyCommands(commands.commandList);

  bot.on(`message`, async (msg: any) => {
    const chatId = msg.chat.id!;
    const text = msg.text!;
    const msgId = msg.message_id!;
    const username: string = msg.from!.username!;
    const callbackQueryId = msg.id!;

    switch (text) {
      case `/start`:
        bot.sendMessage(chatId, commands.startMsg(), { parse_mode: "HTML" });
        break;
      case `/add_wallet`:
        input_state[chatId] = INPUT_ACTION.AddWallet;
        const addWalletList = readWallet(chatId);
        const addWalletMsg = commands.msgWalletList(addWalletList, chatId);

        bot.sendMessage(chatId, addWalletMsg, { parse_mode: "HTML" });
        break;
      case `/del_wallet`:
        input_state[chatId] = INPUT_ACTION.DelWallet;
        const delWalletList = readWallet(chatId);
        const delWalletMsg = commands.msgDelWalletList(delWalletList, chatId);

        bot.sendMessage(chatId, delWalletMsg, { parse_mode: "HTML" });
        break;
      case `/add_token`:
        input_state[chatId] = INPUT_ACTION.AddToken;
        const addTokenWalletList = readWallet(chatId);
        const addTokenWalletListMsg = commands.selectWalletList(
          addTokenWalletList,
          chatId
        );

        bot.sendMessage(chatId, addTokenWalletListMsg, { parse_mode: "HTML" });
        break;
      case `/get_wallet_list`:
        input_state[chatId] = INPUT_ACTION.NoInput;
        const walletList = readWallet(chatId);
        const getWalletMsg = commands.msgGetWalletList(
          walletList,
          username,
          chatId
        );
        bot.sendMessage(chatId, getWalletMsg, { parse_mode: "HTML" });
        break;
      case `/get_token_list`:
        input_state[chatId] = INPUT_ACTION.GetToken;
        const getTokenWalletList = readWallet(chatId);
        const getTokenWalletListMsg = commands.inspectWalletList(
          getTokenWalletList,
          chatId
        );

        bot.sendMessage(chatId, getTokenWalletListMsg, { parse_mode: "HTML" });

        break;

      case `/del_token`:
        input_state[chatId] = INPUT_ACTION.DelToken;
        const delTokenList = readWallet(chatId);
        const delTokenListMsg = commands.selectWalletList(delTokenList, chatId);

        bot.sendMessage(chatId, delTokenListMsg, { parse_mode: "HTML" });
        break;
    }
  });
};

start();
