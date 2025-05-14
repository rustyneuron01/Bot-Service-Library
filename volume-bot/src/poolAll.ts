import * as spl from '@solana/spl-token';
import { MARKET_STATE_LAYOUT_V3, Market } from '@openbook-dex/openbook';
import { AccountInfo, Connection, Keypair, PublicKey } from '@solana/web3.js';
import { u8, u32, struct } from '@solana/buffer-layout';
import { u64, publicKey } from '@solana/buffer-layout-utils';
import base58 from 'bs58';
import { LIQUIDITY_STATE_LAYOUT_V4, LiquidityPoolKeysV4 } from '@raydium-io/raydium-sdk';
import { retrieveEnvVariable } from './utils';

export const SPL_MINT_LAYOUT = struct<any>([
  u32('mintAuthorityOption'),
  publicKey('mintAuthority'),
  u64('supply'),
  u8('decimals'),
  u8('isInitialized'),
  u32('freezeAuthorityOption'),
  publicKey('freezeAuthority')
]);

export const SPL_ACCOUNT_LAYOUT = struct<any>([
  publicKey('mint'),
  publicKey('owner'),
  u64('amount'),
  u32('delegateOption'),
  publicKey('delegate'),
  u8('state'),
  u32('isNativeOption'),
  u64('isNative'),
  u64('delegatedAmount'),
  u32('closeAuthorityOption'),
  publicKey('closeAuthority')
]);


const mainKpStr = retrieveEnvVariable('MAIN_KP');
const rpcUrl = retrieveEnvVariable("RPC_URL");

export const rayFee = new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5");
export const tipAcct = new PublicKey("Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY");
export const RayLiqPoolv4 = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");


export const wallet = Keypair.fromSecretKey(base58.decode(mainKpStr));

const connection = new Connection(rpcUrl, { commitment: "processed" });
const openbookProgram = new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');

async function getMarketInfo(marketId: PublicKey) {
  let reqs = 0;
  let marketInfo = await connection.getAccountInfo(marketId);
  reqs++;

  while (!marketInfo) {
    marketInfo = await connection.getAccountInfo(marketId);
    reqs++;
    if (marketInfo) {
      break;
    } else if (reqs > 20) {
      console.log(`Could not get market info..`);

      return null;
    }
  }

  return marketInfo;
}

export async function fetchMarketId(connection: Connection, baseMint: PublicKey, quoteMint: PublicKey) {
  const accounts = await connection.getProgramAccounts(
    new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
    {
      commitment: "confirmed",
      filters: [
        { dataSize: MARKET_STATE_LAYOUT_V3.span },
        {
          memcmp: {
            offset: MARKET_STATE_LAYOUT_V3.offsetOf("baseMint"),
            bytes: baseMint.toBase58(),
          },
        },
        {
          memcmp: {
            offset: MARKET_STATE_LAYOUT_V3.offsetOf("quoteMint"),
            bytes: quoteMint.toBase58(),
          },
        },
      ],
    }
  );
  return accounts.map(({ account }) => MARKET_STATE_LAYOUT_V3.decode(account.data))[0].ownAddress
}



async function getDecodedData(marketInfo: {
  executable?: boolean;
  owner?: PublicKey;
  lamports?: number;
  data: any;
  rentEpoch?: number | undefined;
}) {
  return Market.getLayout(openbookProgram).decode(marketInfo.data);
}

async function getMintData(mint: PublicKey) {
  return connection.getAccountInfo(mint);
}

async function getDecimals(mintData: AccountInfo<Buffer> | null) {
  if (!mintData) throw new Error('No mint data!');

  return SPL_MINT_LAYOUT.decode(mintData.data).decimals;
}

async function getOwnerAta(mint: { toBuffer: () => Uint8Array | Buffer }, publicKey: PublicKey) {
  const foundAta = PublicKey.findProgramAddressSync(
    [publicKey.toBuffer(), spl.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];

  return foundAta;
}

function getVaultSigner(marketId: { toBuffer: any }, marketDeco: { vaultSignerNonce: { toString: () => any } }) {
  const seeds = [marketId.toBuffer()];
  const seedsWithNonce = seeds.concat(Buffer.from([Number(marketDeco.vaultSignerNonce.toString())]), Buffer.alloc(7));

  return PublicKey.createProgramAddressSync(seedsWithNonce, openbookProgram);
}
