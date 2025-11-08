use std::{collections::HashMap, hash::Hash, str::FromStr};

use axum::{
    Extension, Json, Router, extract::{Path, Query}, routing::{get, post}
};
use database::explaination::model::{Address, Explaination};
use mongodb::results::{DeleteResult, InsertOneResult, UpdateResult};
use utils::AppResult;

use crate::{
    dtos::explaination::CreateExplainationDto,
    extractors::validation_extractor::ValidationExtractor,
    services::Services,
    system_handler::{
        model::{RevelaResponse, SuiNetwork},
        revela_handler::get_move_code,
    },
};

//create new type Address with its validations.
pub struct ExplainationController;
#[allow(clippy::unused_async)]
impl ExplainationController {
    pub fn app() -> Router {
        Router::new()
            .route("/", get(Self::hello))
            .route("/create", post(Self::create_explaination))
            .route(
                "/:id",
                get(Self::get_explanation_by_id)
                    .put(Self::update_explaination)
                    .delete(Self::delete_explaination),
            )
            .route("/owner/:owner", get(Self::get_explanation_by_owner))
            .route("/get_move_code", get(Self::get_move_code))
    }
    pub async fn hello() -> AppResult<Json<String>> {
        Ok(Json("Hello".to_string()))
    }
    pub async fn create_explaination(
        Extension(service): Extension<Services>,
        Json(expl_req): Json<CreateExplainationDto>,
    ) -> AppResult<Json<InsertOneResult>> {
        let result = service.explanation.create_explaination(expl_req).await?;
        Ok(Json(result))
    }
    pub async fn get_explanation_by_owner(
        Extension(service): Extension<Services>,
        Path(owner): Path<Address>,
    ) -> AppResult<Json<Vec<Explaination>>> {
        let result = service
            .explanation
            .get_explanation_by_owner(owner.as_str())
            .await?;
        Ok(Json(result))
    }
    pub async fn get_explanation_by_id(
        Extension(service): Extension<Services>,
        Path(id): Path<String>,
    ) -> AppResult<Json<Explaination>> {
        let result = service.explanation.get_explanation_by_id(&id).await?;
        Ok(Json(result.unwrap_or(Explaination::default())))
    }
    pub async fn update_explaination(
        Extension(service): Extension<Services>,
        Path(id): Path<String>,
        ValidationExtractor(expl_dto): ValidationExtractor<CreateExplainationDto>,
    ) -> AppResult<Json<UpdateResult>> {
        let result = service
            .explanation
            .update_explaination_content(&id, &expl_dto.content)
            .await?;
        Ok(Json(result))
    }
    pub async fn delete_explaination(
        Extension(service): Extension<Services>,
        Path(id): Path<String>,
    ) -> AppResult<Json<DeleteResult>> {
        let result = service.explanation.delete_explaination(&id).await?;
        Ok(Json(result))
    }
    pub async fn get_move_code(
        Query(query): Query<HashMap<String, String>>,
    ) -> AppResult<Json<RevelaResponse>> {
        let pid = Address::new(query.get("pid").expect("Miss query parameter pid"))
        .expect("Invalid package ID");
        let net = SuiNetwork::from_str(query.get("network").expect("Miss query parameter network"))
        .expect("Invalid sui network");
        let response = get_move_code(pid, net).await.unwrap();
        Ok(Json(response))
    }
}
