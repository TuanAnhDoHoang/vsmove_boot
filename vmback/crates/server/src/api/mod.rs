mod explaination_controller;

use axum::routing::{get, Router};

pub async fn health() -> &'static str {
    "🚀 Server is running! 🚀"
}

pub fn app() -> Router {
    Router::new()
        .route("/", get(health))
        .nest("/expl", explaination_controller::ExplainationController::app())
}
