import { abbrAddr } from "./utils";
import { readWalletAlias } from "./utils/wallets_alias";

const commandList = [
  { command: "start", description: "Available Command" },
  { command: "add_wallet", description: "Add Wallet Address" },
  { command: "add_token", description: "Add Token Address" },
  { command: "get_wallet_list", description: "Get Wallet Addresses" },
  { command: "get_token_list", description: "Get Token Addresses" },
  { command: "del_wallet", description: "Delete Wallet Address" },
  { command: "del_token", description: "Delete Token Address" },
];

const startMsg = () => {
  const msg = `Wallet Tracking Bot.

Available Command
  
/start : Show Available Command
/add_wallet : Add Wallet Address
/add_token : Add Token Address
/get_wallet_list : Get Wallet Addresses
/get_token_list : Get Token Addresses
/del_wallet : Delete Wallet Address
/del_token : Delete Token Address`;

  return msg;
};

export {
  commandList,
  startMsg,
  msgWalletList,
  msgGetWalletList,
  selectWalletList,
  inspectWalletList,
  inspectTokenList,
  delTokenList,
  addTokenList,
  msgDelWalletList,
};
