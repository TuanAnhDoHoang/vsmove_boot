pub(crate) mod explaination_service;

use database::Database;
use std::sync::Arc;
use tracing::info;

use crate::services::{explaination_service::{DynExplanationService, ExplainationService}};

#[derive(Clone)]
pub struct Services {
    pub explanation: DynExplanationService,
}

impl Services {
    pub fn new(db: Database) -> Self {
        info!("initializing services...");
        let repository = Arc::new(db);

        let expl = Arc::new(ExplainationService::new(repository.clone())) as DynExplanationService;

        Self { explanation: expl }
    }
}
