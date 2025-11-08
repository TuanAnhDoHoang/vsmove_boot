use std::{collections::HashMap, str::FromStr};

use database::explaination::model::Address;
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Validate, Serialize, Deserialize)]
pub struct RevelaRequest{
    #[validate(nested)]
    pub package_id: Address,
    pub network: SuiNetwork
}

#[derive(Default, Serialize, Deserialize)]
pub struct RevelaResponse {
    data: HashMap<String, String>,
}
impl RevelaResponse {
    pub fn new(hp: HashMap<String, String>) -> Self {
        Self { data: hp }
    }
}

#[derive(Serialize, Deserialize)]
pub enum SuiNetwork{
    Mainnet,
    Testnet,
    Devnet
}
impl FromStr for SuiNetwork{
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s{
            "mainnet" => Ok(Self::Mainnet),
            "testnet" => Ok(Self::Testnet),
            "devnet" => Ok(Self::Devnet),
            _ => Err("Invalid sui network".to_string())
        }
    }
}
impl SuiNetwork{
    pub fn as_str(&self) -> &str{
        match self{
            Self::Mainnet => "mainnet",
            Self::Testnet => "testnet",
            Self::Devnet => "devnet",
        }
    }
}

