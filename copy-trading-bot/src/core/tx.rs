use std::{sync::Arc, time::Duration};

use anyhow::Result;
use colored::Colorize;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    hash::Hash,
    instruction::Instruction,
    signature::Keypair,
    signer::Signer,
    system_instruction, system_transaction,
    transaction::{Transaction, VersionedTransaction},
};
use spl_token::ui_amount_to_amount;

use jito_json_rpc_client::jsonrpc_client::rpc_client::RpcClient as JitoRpcClient;
use tokio::time::Instant;

use crate::{
    common::logger::Logger,
    services::jito::{
        self, get_tip_account, get_tip_value, wait_for_bundle_confirmation, JitoClient,
    },
};

pub async fn new_signed_and_send(
    recent_blockhash: solana_sdk::hash::Hash,
    keypair: &Keypair,
    mut instructions: Vec<Instruction>,
    logger: &Logger,
) -> Result<Vec<String>> {
    let start_time = Instant::now();

    let mut txs = vec![];
    let (tip_account, tip1_account) = get_tip_account()?;

    // jito tip, the upper limit is 0.1
    let mut tip_value = get_tip_value().await?;
    let tip = 0.0004_f64;
    tip_value -= tip;
    let tip_lamports = ui_amount_to_amount(tip, spl_token::native_mint::DECIMALS);
    let tip_value_lamports = ui_amount_to_amount(tip_value, spl_token::native_mint::DECIMALS);

    let jito_tip_instruction =
        system_instruction::transfer(&keypair.pubkey(), &tip_account, tip_lamports);
    instructions.push(jito_tip_instruction);
    if tip_value > 0_f64 {
        let jito_tip2_instruction =
            system_instruction::transfer(&keypair.pubkey(), &tip1_account, tip_value_lamports);
        instructions.push(jito_tip2_instruction);
    }

    // send init tx
    let txn = Transaction::new_signed_with_payer(
        &instructions,
        Some(&keypair.pubkey()),
        &vec![keypair],
        recent_blockhash,
    );

    let jito_client = Arc::new(JitoClient::new(
        format!("{}/api/v1/transactions", *jito::BLOCK_ENGINE_URL).as_str(),
    ));
    let sig = match jito_client.send_transaction(&txn).await {
        Ok(signature) => signature,
        Err(_) => {
            // logger.log(format!("{}", e));
            return Err(anyhow::anyhow!("Bundle status get timeout"
                .red()
                .italic()
                .to_string()));
        }
    };
    txs.push(sig.clone().to_string());
    logger.log(
        format!("[TXN-ELLAPSED]: {:?}", start_time.elapsed())
            .yellow()
            .to_string(),
    );

    Ok(txs)
}
