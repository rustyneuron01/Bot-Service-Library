use raypump_copytrading_bot::{
    common::{config::Config, constants::RUN_MSG},
    engine::monitor::copytrader_pumpfun,
};

#[tokio::main]
async fn main() {
    /* Initial Settings */
    let config = Config::new().await;

    /* Running Bot */
    let run_msg = RUN_MSG;
    println!("{}", run_msg);

    copytrader_pumpfun(
        &config.rpc_wss,
        config.app_state,
        config.token_percent,
        config.slippage,
        config.targetlist,
    )
    .await;
}
