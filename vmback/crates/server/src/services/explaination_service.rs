use std::{sync::Arc};
use async_trait::async_trait;
use database::explaination::{model::Explaination, repository::DynExplanationRepository};
use mongodb::results::{DeleteResult, InsertOneResult, UpdateResult};
use utils::AppResult;
use tracing::{error};

use crate::dtos::explaination::CreateExplainationDto;

pub type DynExplanationService = Arc<dyn ExplainationServiceTrait + Sync + Send>;

#[async_trait]
pub trait ExplainationServiceTrait{
    async fn create_explaination(&self, request: CreateExplainationDto) -> AppResult<InsertOneResult>;
    async fn get_explanation_by_id(&self, id: &str) -> AppResult<Option<Explaination>>;
    async fn get_explanation_by_owner(&self, owner: &str) -> AppResult<Vec<Explaination>>;
    async fn update_explaination_content(&self, id: &str, content: &str) -> AppResult<UpdateResult>;
    async fn delete_explaination(&self, id: &str) -> AppResult<DeleteResult>;
}

pub struct ExplainationService{
    repository: DynExplanationRepository
}

impl ExplainationService{
    pub fn new(repository: DynExplanationRepository) -> Self{
        Self{repository}
    }
}

#[async_trait]
impl ExplainationServiceTrait for ExplainationService{
    async fn create_explaination(&self, request: CreateExplainationDto) -> AppResult<InsertOneResult>{

        let CreateExplainationDto {
            package_id, 
            module_name, 
            function_name, 
            owner, 
            content
        } = request;

        let exist_expl = self.repository.create_explaination(
            package_id.as_str(),
            &module_name,
            &function_name,
            owner.as_str(),
            &content
        ).await?;
        
        Ok(exist_expl)
    }
    async fn get_explanation_by_id(&self, id: &str) -> AppResult<Option<Explaination>>{
        let epl = self.repository.get_explanation_by_id(id)
        .await?;
        if epl.is_none(){
            //Existed Error
            error!("Explanation with this ID({}) is not exist", id);
            return Err(utils::AppError::BadRequest(format!("Id {id} is not exist")));
        }
        Ok(epl)
    }
    async fn get_explanation_by_owner(&self, owner: &str) -> AppResult<Vec<Explaination>>{
        let epls = self.repository.get_explanation_by_owner(owner)
        .await?;
        Ok(epls)
    }
    async fn update_explaination_content(&self, id: &str, new_content: &str) -> AppResult<UpdateResult>{
        let exist_epl = self.get_explanation_by_id(id).await?;
        if exist_epl.is_none(){
            error!("Explanation with this ID({}) is not exist", id);
            return Err(utils::AppError::BadRequest(format!("Id {id} is not exist")))
        }
        let Explaination{
            id: _,
            package_id,
            module_name,
            function_name,
            owner,
           content: _ 
        } = exist_epl.unwrap();

        let res = self.repository.update_explaination(
            id, package_id.as_str(), &module_name, &function_name, owner.as_str(), new_content
        ).await?;
        Ok(res)
    }
    async fn delete_explaination(&self, id: &str) -> AppResult<DeleteResult>{
        let exist_epl = self.get_explanation_by_id(id).await?;
        if exist_epl.is_none(){
            error!("Explanation with this ID({}) is not exist", id);
            return Err(utils::AppError::BadRequest(format!("Id {} is not exist", id)))
        }
        let res = self.repository.delete_explaination(id).await?;
        Ok(res)
    }
}