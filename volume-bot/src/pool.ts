import { Liquidity, LiquidityPoolKeysV4, MARKET_STATE_LAYOUT_V3, Market, TOKEN_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { Commitment, Connection, PublicKey } from "@solana/web3.js";
import { retrieveEnvVariable } from "./utils";

const RPC = retrieveEnvVariable("RPC_URL")

export class PoolKeys {
    static SOLANA_ADDRESS = 'So11111111111111111111111111111111111111112'
    static RAYDIUM_POOL_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
    static OPENBOOK_ADDRESS = 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX';
    static SOL_DECIMALS = 9

    static connection = new Connection(RPC, "confirmed");

    static async fetchMarketId(connection: Connection, baseMint: PublicKey, quoteMint: PublicKey, commitment: Commitment) {
        const accounts = await connection.getProgramAccounts(
            new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
            {
                commitment,
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

    static async fetchMarketInfo(marketId: PublicKey) {
        const marketAccountInfo = await this.connection.getAccountInfo(marketId);
        if (!marketAccountInfo) {
            throw new Error('Failed to fetch market info for market id ' + marketId.toBase58());
        }

        return MARKET_STATE_LAYOUT_V3.decode(marketAccountInfo.data);
    }

    static async generateV4PoolInfo(baseMint: PublicKey, baseDecimals: number, quoteMint: PublicKey, marketID: PublicKey) {
        const poolInfo = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            baseMint: baseMint,
            quoteMint: quoteMint,
            baseDecimals: 0,
            quoteDecimals: this.SOL_DECIMALS,
            programId: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
            marketId: marketID,
            marketProgramId: new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
        });

        return { poolInfo }
    }

}

interface MintInfo {
    value: {
        data: {
            parsed: {
                info: {
                    decimals: number
                }
            }
        }
    }
}