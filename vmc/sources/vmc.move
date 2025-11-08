/// Module: vmc - Contract Explanation Management System
module vmc::vmc {
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::dynamic_field as df;
    use sui::display;
    use sui::package;
    use sui::vec_map::{Self, VecMap};

    // ===== Error Codes =====
    const ENotAuthorized: u64 = 1;
    const EExplanationNotFound: u64 = 2;
    const EInvalidRating: u64 = 3;

    // ===== Structs =====
    
    /// One-time witness for the module
    public struct VMC has drop {}

    /// Admin capability for access control
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Individual explanation entry
    public struct Explanation has key, store {
        id: UID,
        title: String,
        package_id: address,
        module_name: String,
        function_name: String,
        explanation_text: String,
        author: address,
        rating: u64,
        votes: u64,
        created_at: u64,
    }

    /// Shared registry for all explanations
    public struct ExplanationRegistry has key {
        id: UID,
        explanations: vector<ID>,
        total_count: u64,
        categories: VecMap<String, vector<ID>>,
    }

    /// User profile with dynamic fields
    public struct UserProfile has key {
        id: UID,
        username: String,
        contributions: u64,
        reputation: u64,
    }

    // ===== Events =====
    
    public struct ExplanationCreated has copy, drop {
        explanation_id: ID,
        title: String,
        author: address,
        package_id: address,
        module_name: String,
        function_name: String,
    }

    public struct ExplanationRated has copy, drop {
        explanation_id: ID,
        new_rating: u64,
        voter: address,
    }

    public struct UserRegistered has copy, drop {
        user_id: ID,
        username: String,
        user_address: address,
    }

    // ===== Init Function =====
    
    fun init(otw: VMC, ctx: &mut TxContext) {
        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        
        // Create shared registry
        let registry = ExplanationRegistry {
            id: object::new(ctx),
            explanations: vector::empty(),
            total_count: 0,
            categories: vec_map::empty(),
        };

        // Create display for Explanation objects
        let keys = vector[
            string::utf8(b"title"),
            string::utf8(b"description"),
            string::utf8(b"author"),
            string::utf8(b"rating"),
        ];
        
        let values = vector[
            string::utf8(b"{title}"),
            string::utf8(b"Smart contract explanation for {module_name}::{function_name}"),
            string::utf8(b"{author}"),
            string::utf8(b"{rating}/5 stars ({votes} votes)"),
        ];

        let publisher = package::claim(otw, ctx);
        let mut display = display::new_with_fields<Explanation>(
            &publisher, keys, values, ctx
        );
        display::update_version(&mut display);

        // Transfer objects
        transfer::public_transfer(admin_cap, tx_context::sender(ctx));
        transfer::share_object(registry);
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    // ===== Public Functions =====

    /// Create a new explanation (requires admin capability)
    public fun create_explanation(
        _admin_cap: &AdminCap,
        registry: &mut ExplanationRegistry,
        title: String,
        package_id: address,
        module_name: String,
        function_name: String,
        explanation_text: String,
        ctx: &mut TxContext
    ): ID {
        let explanation = Explanation {
            id: object::new(ctx),
            title,
            package_id,
            module_name,
            function_name,
            explanation_text,
            author: tx_context::sender(ctx),
            rating: 0,
            votes: 0,
            created_at: tx_context::epoch(ctx),
        };

        let explanation_id = object::id(&explanation);
        
        // Add to registry vectors
        vector::push_back(&mut registry.explanations, explanation_id);
        registry.total_count = registry.total_count + 1;

        // Add to category (using module_name as category)
        if (vec_map::contains(&registry.categories, &module_name)) {
            let category_list = vec_map::get_mut(&mut registry.categories, &module_name);
            vector::push_back(category_list, explanation_id);
        } else {
            let mut new_category = vector::empty();
            vector::push_back(&mut new_category, explanation_id);
            vec_map::insert(&mut registry.categories, module_name, new_category);
        };

        // Emit event
        event::emit(ExplanationCreated {
            explanation_id,
            title: explanation.title,
            author: explanation.author,
            package_id,
            module_name,
            function_name,
        });

        transfer::share_object(explanation);
        explanation_id
    }

    /// Rate an explanation
    public fun rate_explanation(
        explanation: &mut Explanation,
        rating: u64,
        ctx: &mut TxContext
    ) {
        assert!(rating >= 1 && rating <= 5, EInvalidRating);
        
        // Update rating (simple average)
        let total_score = explanation.rating * explanation.votes + rating;
        explanation.votes = explanation.votes + 1;
        explanation.rating = total_score / explanation.votes;

        event::emit(ExplanationRated {
            explanation_id: object::id(explanation),
            new_rating: explanation.rating,
            voter: tx_context::sender(ctx),
        });
    }

    /// Register user profile
    public fun register_user(
        username: String,
        ctx: &mut TxContext
    ): ID {
        let mut profile = UserProfile {
            id: object::new(ctx),
            username,
            contributions: 0,
            reputation: 0,
        };

        let user_id = object::id(&profile);
        
        // Add dynamic field for user preferences
        df::add(&mut profile.id, b"preferences", vector::empty<String>());
        
        event::emit(UserRegistered {
            user_id,
            username: profile.username,
            user_address: tx_context::sender(ctx),
        });

        transfer::transfer(profile, tx_context::sender(ctx));
        user_id
    }

    /// Add user preference using dynamic fields
    public fun add_user_preference(
        profile: &mut UserProfile,
        preference: String,
    ) {
        let preferences: &mut vector<String> = df::borrow_mut(&mut profile.id, b"preferences");
        vector::push_back(preferences, preference);
    }

    /// Update user contribution count
    public fun update_user_contribution(
        profile: &mut UserProfile,
        points: u64,
    ) {
        profile.contributions = profile.contributions + 1;
        profile.reputation = profile.reputation + points;
    }

    // ===== View Functions =====

    /// Get explanation details
    public fun get_explanation_info(explanation: &Explanation): (String, address, String, String, u64, u64) {
        (
            explanation.title,
            explanation.package_id,
            explanation.module_name,
            explanation.function_name,
            explanation.rating,
            explanation.votes
        )
    }

    /// Get registry stats
    public fun get_registry_stats(registry: &ExplanationRegistry): (u64, u64) {
        (registry.total_count, vec_map::length(&registry.categories))
    }

    /// Get explanations by category (using Option type)
    public fun get_explanations_by_category(
        registry: &ExplanationRegistry,
        category: String
    ): Option<vector<ID>> {
        if (vec_map::contains(&registry.categories, &category)) {
            option::some(*vec_map::get(&registry.categories, &category))
        } else {
            option::none()
        }
    }

    /// Get user profile info
    public fun get_user_info(profile: &UserProfile): (String, u64, u64) {
        (profile.username, profile.contributions, profile.reputation)
    }

    /// Get user preferences using dynamic fields
    public fun get_user_preferences(profile: &UserProfile): &vector<String> {
        df::borrow(&profile.id, b"preferences")
    }

    /// Check if explanation exists in registry
    public fun explanation_exists(registry: &ExplanationRegistry, explanation_id: ID): bool {
        vector::contains(&registry.explanations, &explanation_id)
    }

    // ===== Admin Functions =====

    /// Remove explanation (admin only)
    public fun remove_explanation(
        _admin_cap: &AdminCap,
        registry: &mut ExplanationRegistry,
        explanation_id: ID,
    ) {
        let (exists, index) = vector::index_of(&registry.explanations, &explanation_id);
        assert!(exists, EExplanationNotFound);
        
        vector::remove(&mut registry.explanations, index);
        registry.total_count = registry.total_count - 1;
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(VMC {}, ctx);
    }
}