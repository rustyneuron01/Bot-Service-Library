use std::{str::FromStr, sync::Arc, time::Duration};

use anyhow::{anyhow, Result};
use borsh::from_slice;
use borsh_derive::{BorshDeserialize, BorshSerialize};
use chrono::Utc;
use colored::Colorize;
use raydium_amm::math::U128;
use serde::{Deserialize, Serialize};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    system_program,
};
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};
use spl_token::{amount_to_ui_amount, ui_amount_to_amount};
use spl_token_client::token::TokenError;
use tokio::time::Instant;

use crate::{
    common::{config::SwapConfig, logger::Logger},
    core::{token, tx},
    engine::swap::{SwapDirection, SwapInType},
};

pub const TEN_THOUSAND: u64 = 10000;

#[derive(Clone)]
pub struct Pump {
    pub rpc_nonblocking_client: Arc<solana_client::nonblocking::rpc_client::RpcClient>,
    pub keypair: Arc<Keypair>,
    pub rpc_client: Option<Arc<solana_client::rpc_client::RpcClient>>,
}

impl Pump {
    pub fn new(
        rpc_nonblocking_client: Arc<solana_client::nonblocking::rpc_client::RpcClient>,
        rpc_client: Arc<solana_client::rpc_client::RpcClient>,
        keypair: Arc<Keypair>,
    ) -> Self {
        Self {
            rpc_nonblocking_client,
            keypair,
            rpc_client: Some(rpc_client),
        }
    }

    pub async fn swap_by_mint(
        &self,
        mint_str: &str,
        swap_config: SwapConfig,
        start_time: Instant,
    ) -> Result<Vec<String>> {
        let logger = Logger::new("[PUMPFUN-SWAP-BY-MINT] => ".blue().to_string());
        logger.log(
            format!(
                "[SWAP-BEGIN]({}) - {} :: {:?}",
                mint_str,
                chrono::Utc::now(),
                start_time.elapsed()
            )
            .yellow()
            .to_string(),
        );
        let (amount_specified, _amount_ui_pretty) = match swap_config.swap_direction {
            SwapDirection::Buy => {
                // Create base ATA if it doesn't exist.
                // ----------------------------
                match token::get_account_info(
                    self.rpc_nonblocking_client.clone(),
                    token_out,
                    out_ata,
                )
                .await
                {
                    Ok(_) => {
                        // Base ata exists. skipping creation..
                        // --------------------------
                    }
                    Err(TokenError::AccountNotFound) | Err(TokenError::AccountInvalidOwner) => {
                        // "Base ATA for mint {} does not exist. will be create", token_out
                        // --------------------------
                        create_instruction = Some(create_associated_token_account(
                            &owner,
                            &owner,
                            &token_out,
                            &program_id,
                        ));
                    }
                    Err(_) => {
                        // Error retrieving out ATA
                        // ---------------------------
                    }
                }
                (
                    ui_amount_to_amount(swap_config.amount_in, spl_token::native_mint::DECIMALS),
                    (swap_config.amount_in, spl_token::native_mint::DECIMALS),
                )
            }
                (
                    amount,
                    (
                        amount_to_ui_amount(amount, in_mint.base.decimals),
                        in_mint.base.decimals,
                    ),
                )
            }
        };

        // Constants-Instruction Configuration
        // -------------------
        let build_swap_instruction = Instruction::new_with_bincode(
            pump_program,
            &(pump_method, token_amount, sol_amount_threshold),
            input_accouts,
        );

        let mut instructions = vec![];
        if let Some(create_instruction) = create_instruction {
            instructions.push(create_instruction);
        }
        if amount_specified > 0 {
            instructions.push(build_swap_instruction)
        }
        if let Some(close_instruction) = close_instruction {
            instructions.push(close_instruction);
        }
        if instructions.is_empty() {
            return Err(anyhow!("Instructions is empty, no txn required."
                .red()
                .italic()
                .to_string()));
        }
        logger.log(
            format!(
                "[BUILD-TXN]({}) - {} :: ({:?})",
                mint_str,
                Utc::now(),
                start_time.elapsed()
            )
            .yellow()
            .to_string(),
        );
        // Sign 'n Send Txn
        // --------------------
        tx::new_signed_and_send(
            recent_blockhash,
            &self.keypair.clone(),
            instructions,
            &logger,
        )
        .await
    }
}

fn min_amount_with_slippage(input_amount: u64, slippage_bps: u64) -> u64 {
    input_amount
        .checked_mul(TEN_THOUSAND.checked_sub(slippage_bps).unwrap())
        .unwrap()
        .checked_div(TEN_THOUSAND)
        .unwrap()
}
fn max_amount_with_slippage(input_amount: u64, slippage_bps: u64) -> u64 {
    input_amount
        .checked_mul(slippage_bps.checked_add(TEN_THOUSAND).unwrap())
        .unwrap()
        .checked_div(TEN_THOUSAND)
        .unwrap()
}
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RaydiumInfo {
    pub base: f64,
    pub quote: f64,
    pub price: f64,
}
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PumpInfo {
    pub mint: String,
    pub bonding_curve: String,
    pub associated_bonding_curve: String,
    pub raydium_pool: Option<String>,
    pub raydium_info: Option<RaydiumInfo>,
    pub complete: bool,
    pub virtual_sol_reserves: u64,
    pub virtual_token_reserves: u64,
    pub total_supply: u64,
}

#[derive(Debug, BorshSerialize, BorshDeserialize)]
pub struct BondingCurveAccount {
    pub discriminator: u64,
    pub virtual_token_reserves: u64,
    pub virtual_sol_reserves: u64,
    pub real_token_reserves: u64,
    pub real_sol_reserves: u64,
    pub token_total_supply: u64,
    pub complete: bool,
}

pub fn get_pda(mint: &Pubkey, program_id: &Pubkey) -> Result<Pubkey> {
    let seeds = [b"bonding-curve".as_ref(), mint.as_ref()];
    let (bonding_curve, _bump) = Pubkey::find_program_address(&seeds, program_id);
    Ok(bonding_curve)
}
