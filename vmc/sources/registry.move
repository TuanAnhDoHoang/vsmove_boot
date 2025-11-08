/// Enhanced Registry Module for VMC
module vmc::registry {
    use std::string::String;
    use sui::object::{Self, UID, ID};
    use sui::tx_context::TxContext;
    use sui::vec_map::{Self, VecMap};
    use sui::transfer;

    /// Global registry for all explanations
    public struct ExplanationRegistry has key {
        id: UID,
        explanations: vector<ID>,
        categories: VecMap<String, vector<ID>>,
        total_count: u64,
    }

    /// Initialize registry
    public fun create_registry(ctx: &mut TxContext): ExplanationRegistry {
        ExplanationRegistry {
            id: object::new(ctx),
            explanations: vector::empty(),
            categories: vec_map::empty(),
            total_count: 0,
        }
    }

    /// Add explanation to registry
    public fun add_explanation(
        registry: &mut ExplanationRegistry,
        explanation_id: ID,
        category: String,
    ) {
        vector::push_back(&mut registry.explanations, explanation_id);
        
        if (vec_map::contains(&registry.categories, &category)) {
            let category_list = vec_map::get_mut(&mut registry.categories, &category);
            vector::push_back(category_list, explanation_id);
        } else {
            let mut new_category = vector::empty();
            vector::push_back(&mut new_category, explanation_id);
            vec_map::insert(&mut registry.categories, category, new_category);
        };
        
        registry.total_count = registry.total_count + 1;
    }

    /// Get explanations by category
    public fun get_explanations_by_category(
        registry: &ExplanationRegistry,
        category: &String
    ): &vector<ID> {
        vec_map::get(&registry.categories, category)
    }

    /// Get total count
    public fun get_total_count(registry: &ExplanationRegistry): u64 {
        registry.total_count
    }
}