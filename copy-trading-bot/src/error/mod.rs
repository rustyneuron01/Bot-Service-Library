use serde_json::Error;
use solana_client::{
    client_error::ClientError as SolanaClientError, pubsub_client::PubsubClientError,
};
use solana_sdk::pubkey::ParsePubkeyError;

#[derive(Debug)]
pub enum ClientError {
    /// Bonding curve account was not found
    BondingCurveNotFound,
    /// Error related to bonding curve operations
    BondingCurveError(&'static str),
    /// Error deserializing data using Borsh
    BorshError(std::io::Error),
    /// Error from Solana RPC client
    SolanaClientError(solana_client::client_error::ClientError),
    /// Error uploading metadata
    UploadMetadataError(Box<dyn std::error::Error>),
    /// Invalid input parameters
    InvalidInput(&'static str),
    /// Insufficient funds for transaction
    InsufficientFunds,
    /// Transaction simulation failed
    SimulationError(String),
    /// Rate limit exceeded
    RateLimitExceeded,
    InvalidEventType,

    ChannelClosed,
}

impl std::fmt::Display for ClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::BondingCurveNotFound => write!(f, "Bonding curve not found"),
            Self::BondingCurveError(msg) => write!(f, "Bonding curve error: {}", msg),
            Self::BorshError(err) => write!(f, "Borsh serialization error: {}", err),
            Self::SolanaClientError(err) => write!(f, "Solana client error: {}", err),
            Self::UploadMetadataError(err) => write!(f, "Metadata upload error: {}", err),
            Self::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
            Self::InsufficientFunds => write!(f, "Insufficient funds for transaction"),
            Self::Duplicate(msg) => write!(f, "Duplicate event: {}", msg),
            Self::InvalidEventType => write!(f, "Invalid event type"),
            Self::ChannelClosed => write!(f, "Channel closed"),
        }
    }
}
impl std::error::Error for ClientError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::BorshError(err) => Some(err),
            Self::SolanaClientError(err) => Some(err),
            Self::UploadMetadataError(err) => Some(err.as_ref()),
            Self::ExternalService(_) => None,
            Self::Redis(_, _) => None,
            Self::InvalidEventType => None,
            Self::ChannelClosed => None,
            _ => None,
        }
    }
}

impl From<SolanaClientError> for ClientError {
    fn from(error: SolanaClientError) -> Self {
        ClientError::Solana("Solana client error".to_string(), error.to_string())
    }
}

pub type ClientResult<T> = Result<T, ClientError>;
