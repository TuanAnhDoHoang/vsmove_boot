use std::{collections::HashMap, fs, process::Command};
use anyhow::Result;
use database::explaination::model::Address;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use base64::Engine;

use crate::system_handler::model::{RevelaResponse, SuiNetwork};

#[derive(Debug, Deserialize, Serialize)]
struct RpcResponse {
    result: ResponseData,
}

#[derive(Debug, Deserialize, Serialize)]
struct ResponseData {
    data: GetObjectResponse,
}

#[derive(Debug, Deserialize, Serialize)]
#[allow(non_snake_case)]
struct GetObjectResponse {
    bcs: Bcs 
}

#[derive(Debug, Deserialize, Serialize)]
#[allow(non_snake_case)]
struct Bcs{
    moduleMap: Value
}

pub async fn get_move_code(id: Address, network: SuiNetwork) -> Result<RevelaResponse> {
    let url = format!("https://fullnode.{}.sui.io:443", network.as_str());

    let payload = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sui_getObject",
        "params": [
            id.as_str(),
            {
                // "showType": false,
                // "showOwner": false,
                // "showPreviousTransaction": false,
                // "showContent": false,
                // "showStorageRebate":false,
                "showBcs": true,
            }
        ]
    });

    let client = Client::new();
    let resp: RpcResponse = client.post(url).json(&payload).send().await?.json().await?;
    let result: Value = resp.result.data.bcs.moduleMap;
    let obj = result.as_object().expect("top level is not object");

    let mut storage: HashMap<String, String> = HashMap::new();
    //fs::create_dir("/tmp/modules").expect("Error creating path");

    for(key, inner_val) in obj{
        let decoded = base64::engine::general_purpose::STANDARD
        .decode(inner_val.as_str().unwrap())
        .unwrap();

        let path =  format!("/tmp/modules/{key}.mv");
        fs::write(&path, decoded).expect("Error writting file");

        let response = Command::new("revela").arg("-b").arg(path).output().expect("Error when revela");
        let data = String::from_utf8_lossy(&response.stdout.clone()).to_string();
        storage.insert(key.to_string(), data);
    }

    let response = RevelaResponse::new(storage);
    Ok(response)
}
