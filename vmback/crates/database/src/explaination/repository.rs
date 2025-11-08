use crate::{explaination::model::{Address, Explaination}, Database};
use async_trait::async_trait;
use mongodb::{bson::{doc, oid::ObjectId}, results::{DeleteResult, InsertOneResult, UpdateResult}};
use tokio_stream::StreamExt;
use utils::AppResult;

use std::{str::FromStr, sync::Arc};

pub type DynExplanationRepository = Arc<dyn ExplainationRepositoryTrait + Send + Sync>;

#[async_trait]
pub trait ExplainationRepositoryTrait{
    async fn create_explaination(
        &self, 
        package_id: &str,
        module_name: &str,
        function_name: &str,
        owner: &str,
        content: &str,
    ) -> AppResult<InsertOneResult> ;
    async fn update_explaination(
        &self,
        id: &str,
        package_id: &str,
        module_name: &str,
        function_name: &str,
        owner: &str,
        content: &str,
    ) -> AppResult<UpdateResult>;
    async fn delete_explaination(&self, id: &str) -> AppResult<DeleteResult>;
    async fn get_explanation_by_owner(&self, owner: &str) -> AppResult<Vec<Explaination>>;
    async fn get_explanation_by_id(&self, id: &str) -> AppResult<Option<Explaination>>;
}
#[async_trait]
impl ExplainationRepositoryTrait for Database{
    async fn create_explaination(
        &self, 
        package_id: &str,
        module_name: &str,
        function_name: &str,
        owner: &str,
        content: &str,
    ) -> AppResult<InsertOneResult>{
        let doc = Explaination{
            id: Some(ObjectId::new()),
            package_id: Address::from_str(package_id).expect("Validation error"),
            module_name: module_name.to_string(),
            function_name: function_name.to_string(),
            owner: Address::from_str(owner).expect("Validation error"),
            content: content.to_string(),
        };
        let res = self.expl_col.insert_one(doc).await?;
        Ok(res)
    }
    async fn update_explaination(
        &self,
        id: &str,
        package_id: &str,
        module_name: &str,
        function_name: &str,
        owner: &str,
        content: &str,
    ) -> AppResult<UpdateResult>{
        let id = ObjectId::parse_str(id)?;
        let filter = doc! { "_id": id };
        let update = doc! { "$set": doc! {
            "package_id": package_id,
            "module_name": module_name,
            "function_name": function_name,
            "owner": owner,
            "content": content,
            } 
        };
        let res = self.expl_col.update_one(filter, update).await?;
        Ok(res)
    }
    async fn delete_explaination(&self, id: &str) -> AppResult<DeleteResult>{
        let id = ObjectId::parse_str(id)?;
        let filter = doc! {"_id": id};
        let res = self.expl_col.delete_one(filter).await?;
        Ok(res)
    }
    async fn get_explanation_by_owner(&self, owner: &str) -> AppResult<Vec<Explaination>>{
        let filter = doc! {"owner": owner};
        let mut cursor = self.expl_col.find(filter).await?;
        let mut res: Vec<Explaination> = Vec::new();
        while let Some(expl) = cursor.next().await{
            res.push(expl?);
        }
        Ok(res)
    }
    async fn get_explanation_by_id(&self, id: &str) -> AppResult<Option<Explaination>>{
        let id = ObjectId::parse_str(id)?;
        let filter = doc! {"_id": id};
        let res  = self.expl_col.find_one(filter).await?;
        Ok(res)
    }
}