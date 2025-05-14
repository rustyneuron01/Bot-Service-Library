use anyhow::Result;
use colored::Colorize;
use dotenv::dotenv;
use lazy_static::lazy_static;
use reqwest::Error;
use serde::Deserialize;
use serde_json::{json, Value};
use solana_sdk::{bs58, commitment_config::CommitmentConfig, signature::Keypair, signer::Signer};
use std::{env, sync::Arc};

use crate::{
    common::{constants::INIT_MSG, logger::Logger},
    dex::pump_fun::PUMP_PROGRAM,
    engine::swap::{SwapDirection, SwapInType},
};

pub struct Config {
    pub rpc_wss: String,
    pub app_state: AppState,
    pub token_percent: f64,
    pub targetlist: Targetlist,
    pub slippage: u64,
}

impl Config {
    pub async fn new() -> Self {
        let init_msg = INIT_MSG;
        println!("{}", init_msg);

        dotenv().ok(); // Load .env file

        Config {
            rpc_wss,
            app_state,
            token_percent,
            slippage,
            targetlist,
        }
    }
}

lazy_static! {
    pub static ref SUBSCRIPTION_MSG: Value = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "transactionSubscribe",
        "params": [
            {
                "failed": false,
                "accountInclude": [PUMP_PROGRAM],
                "accountExclude": [JUP_PUBKEY],
            },
            {
                "commitment": "processed",
                "encoding": "jsonParsed",
                "transactionDetails": "full",
                "maxSupportedTransactionVersion": 0
            }
        ]
    });
}

use super::targetlist::Targetlist;

#[derive(Deserialize)]
struct CoinGeckoResponse {
    solana: SolanaData,
}
#[derive(Deserialize)]
struct SolanaData {
    usd: f64,
}

#[derive(Clone)]
pub struct AppState {
    pub rpc_client: Arc<solana_client::rpc_client::RpcClient>,
    pub rpc_nonblocking_client: Arc<solana_client::nonblocking::rpc_client::RpcClient>,
    pub wallet: Arc<Keypair>,
}

#[derive(Clone)]
pub struct SwapConfig {
    pub swap_direction: SwapDirection,
    pub in_type: SwapInType,
    pub amount_in: f64,
    pub slippage: u64,
    pub use_jito: bool,
}

pub fn import_env_var(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| panic!("Environment variable {} is not set", key))
}

pub fn create_rpc_client() -> Result<Arc<solana_client::rpc_client::RpcClient>> {
    let rpc_https = import_env_var("RPC_HTTPS");
    let rpc_client = solana_client::rpc_client::RpcClient::new_with_commitment(
        rpc_https,
        CommitmentConfig::processed(),
    );
    Ok(Arc::new(rpc_client))
}

pub fn import_wallet() -> Result<Arc<Keypair>> {
    let priv_key = import_env_var("PRIVATE_KEY");
    let wallet: Keypair = Keypair::from_base58_string(priv_key.as_str());

    Ok(Arc::new(wallet))
}
