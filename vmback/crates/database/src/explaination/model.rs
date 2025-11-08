use std::str::FromStr;

use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use validator::ValidationError;
use validator::Validate;
use validator::ValidationErrors;

#[derive(Default, Validate, Serialize, Deserialize, Clone, Debug)]
pub struct Explaination{
    #[serde(rename = "_id", skip_deserializing, skip_serializing)]
    pub id: Option<ObjectId>,
    #[validate(nested)]
    pub package_id: Address,
    #[validate(length(min = 1))]
    pub module_name: String,
    #[validate(length(min = 1))]
    pub function_name: String,
    // #[validate(custom(function = "validate_sui_id"))]
    #[validate(nested)]
    pub owner: Address,
    #[validate(length(min = 1))]
    pub content: String,
} 

pub fn validate_sui_id(address: impl Into<String>) -> Result<(), ValidationError>{
    let address = address.into();
    if address.len() != 66{
        return Err(ValidationError::new("Address must has length 66 chars"));
    }
    if !address.starts_with("0x"){
        return Err(ValidationError::new("Address must has prefix 0x"));
    }
    if !address[2..].chars().all(|c| c.is_ascii_hexdigit()){
        return Err(ValidationError::new("Address must be a hex number"));
    }
    Ok(())
}

#[derive(Default, Clone, Serialize, Deserialize, Debug)]
pub struct Address(String);
impl Address{
    pub fn new(a: impl Into<String>) -> Result<Self, String>{
        let a = a.into();
        validate_sui_id(a.clone()).map_err(|e| e.to_string())?;
        Ok(Address(a))
    }
    pub fn as_str(&self) -> &str{
        &self.0
    }
}

// impl Default for Address{
//     fn default() -> Self {
//         Self(String::new())
//     }
// }
impl Validate for Address{
    fn validate(&self) -> Result<(), validator::ValidationErrors> {
        validate_sui_id(self.0.clone()).map_err(|e|{
            let mut es = ValidationErrors::new();
            es.add("address", e);
            es
        })
    }
}
impl FromStr for Address{
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Address::new(s)
    }
}