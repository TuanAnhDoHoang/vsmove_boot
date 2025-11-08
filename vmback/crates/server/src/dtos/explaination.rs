use database::explaination::model::Address;
use serde::{Deserialize, Serialize};
use validator::{Validate};

#[derive(Validate, Serialize, Deserialize, Debug)]
pub struct CreateExplainationDto{
    #[validate(nested)]
    pub package_id: Address,
    #[validate(length(min = 1))]
    pub module_name: String,
    #[validate(length(min = 1))]
    pub function_name: String,
    #[validate(nested)]
    pub owner: Address,
    #[validate(length(min = 1))]
    pub content: String,
}
// pub fn validate_sui_id(address: impl Into<String>) -> Result<(), ValidationError>{
//     let address = address.into();
//     if address.len() != 64{
//         return Err(ValidationError::new("Address must has length 64 chars"));
//     }
//     if !address.starts_with("0x"){
//         return Err(ValidationError::new("Address must has prefix 0x"));
//     }
//     if !address[2..].chars().all(|c| c.is_ascii_hexdigit()){
//         return Err(ValidationError::new("Address must be a hex number"));
//     }
//     Ok(())
// }