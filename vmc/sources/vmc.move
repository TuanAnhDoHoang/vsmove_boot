/// Module: vmc - Simple Contract Explanation System
module vmc::vmc;

use std::option::{Self, Option};
use std::string::{Self, String};
use sui::display;
use sui::dynamic_field as df;
use sui::event;
use sui::object::{Self, UID, ID};
use sui::package;
use sui::transfer;
use sui::tx_context::{Self, TxContext};

// ===== Error Codes =====
const EInvalidRating: u64 = 3;

// ===== Structs =====

/// One-time witness for the module. **Đã sửa lại thành 'has drop' (theo yêu cầu của Sui).**
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
    category: Option<String>,
}

/// User profile with dynamic fields
public struct UserProfile has key {
    id: UID,
    username: String,
    contributions: u64,
    reputation: u64,
}

/// Personal explanation registry for each user
public struct ExplanationRegistry has key {
    id: UID,
    owner: address,
    explanations: vector<ID>,
    total_count: u64,
}

// ===== Events (Không đổi) =====

public struct ExplanationCreated has copy, drop {
    explanation_id: ID,
    title: String,
    author: address,
    package_id: address,
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

// ===== Init Function (Đã hợp nhất Display Object setup) =====

fun init(otw: VMC, ctx: &mut TxContext) {
    use std::string; // Cần thiết cho Display Object

    // 1. Tạo AdminCap
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::public_transfer(admin_cap, tx_context::sender(ctx));

    // 2. Lấy Publisher (sử dụng OTW ngay lập tức)
    let publisher = package::claim(otw, ctx);

    // 3. Tạo Display Object cho kiểu Explanation
    let mut display = display::new<Explanation>(&publisher, ctx);

    // 4. Định nghĩa các trường Display Object
    display::add(&mut display, string::utf8(b"name"), string::utf8(b"Explanation: {title}"));
    display::add(
        &mut display,
        string::utf8(b"description"),
        string::utf8(b"Mã nguồn: {package_id}::{module_name}::{function_name}"),
    );

    display::add(&mut display, string::utf8(b"author"), string::utf8(b"{author}"));
    display::add(&mut display, string::utf8(b"votes"), string::utf8(b"{votes}"));
    display::add(&mut display, string::utf8(b"rating"), string::utf8(b"{rating}"));
    display::add(
        &mut display,
        string::utf8(b"explanation_text"),
        string::utf8(b"{explanation_text}"),
    );

    // 5. Áp dụng và Publish
    display.update_version();
    transfer::public_transfer(publisher, tx_context::sender(ctx));
    transfer::public_share_object(display);
}

// ===== Public Functions =====

/// Create explanation and return the object
public fun create_explanation(
    title: String,
    package_id: address,
    module_name: String,
    function_name: String,
    explanation_text: String,
    category: Option<String>,
    ctx: &mut TxContext,
): Explanation {
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
        category,
    };

    event::emit(ExplanationCreated {
        explanation_id: object::id(&explanation),
        title,
        author: tx_context::sender(ctx),
        package_id,
    });

    explanation
}

/// Create personal explanation registry
public fun create_explanation_registry(ctx: &mut TxContext): ExplanationRegistry {
    ExplanationRegistry {
        id: object::new(ctx),
        owner: tx_context::sender(ctx),
        explanations: vector::empty(),
        total_count: 0,
    }
}

/// Add explanation to personal registry
public fun add_to_registry(
    registry: &mut ExplanationRegistry,
    explanation_id: ID,
) {
    vector::push_back(&mut registry.explanations, explanation_id);
    registry.total_count = registry.total_count + 1;
}

public fun rate_explanation(
    _admin_cap: &AdminCap,
    explanation: &mut Explanation,
    rating: u64,
    ctx: &mut TxContext,
) {
    assert!(rating >= 1 && rating <= 5, EInvalidRating);

    let total_score = explanation.rating * explanation.votes + rating;
    explanation.votes = explanation.votes + 1;
    explanation.rating = total_score / explanation.votes;

    event::emit(ExplanationRated {
        explanation_id: object::id(explanation),
        new_rating: explanation.rating,
        voter: tx_context::sender(ctx),
    });
}

/// Register user and return profile object
public fun register_user(username: String, ctx: &mut TxContext): UserProfile {
    let mut profile = UserProfile {
        id: object::new(ctx),
        username,
        contributions: 0,
        reputation: 0,
    };

    df::add(&mut profile.id, b"preferences", vector::empty<String>());

    event::emit(UserRegistered {
        user_id: object::id(&profile),
        username: profile.username,
        user_address: tx_context::sender(ctx),
    });

    profile
}

public fun add_user_preference(profile: &mut UserProfile, preference: String) {
    let preferences: &mut vector<String> = df::borrow_mut(&mut profile.id, b"preferences");
    vector::push_back(preferences, preference);
}

public fun update_user_contribution(profile: &mut UserProfile, points: u64) {
    profile.contributions = profile.contributions + 1;
    profile.reputation = profile.reputation + points;
}

// ===== View Functions (Không đổi) =====

public fun get_explanation_info(
    explanation: &Explanation,
): (String, address, String, String, u64, u64, Option<String>) {
    (
        explanation.title,
        explanation.package_id,
        explanation.module_name,
        explanation.function_name,
        explanation.rating,
        explanation.votes,
        explanation.category,
    )
}

public fun get_explanation_category(explanation: &Explanation): Option<String> {
    explanation.category
}

public fun update_explanation_category(explanation: &mut Explanation, category: Option<String>) {
    explanation.category = category;
}

public fun get_user_info(profile: &UserProfile): (String, u64, u64) {
    (profile.username, profile.contributions, profile.reputation)
}

public fun get_user_preferences(profile: &UserProfile): &vector<String> {
    df::borrow(&profile.id, b"preferences")
}

public fun has_user_preferences(profile: &UserProfile): bool {
    df::exists_(&profile.id, b"preferences")
}

/// Get registry info
public fun get_registry_info(registry: &ExplanationRegistry): (address, u64, &vector<ID>) {
    (registry.owner, registry.total_count, &registry.explanations)
}

/// Complete flow: Create explanation and add to registry (auto-create if needed)
public fun create_explanation_with_registry(
    title: String,
    package_id: address,
    module_name: String,
    function_name: String,
    explanation_text: String,
    category: Option<String>,
    has_registry: bool,
    ctx: &mut TxContext,
): (Explanation, ExplanationRegistry) {
    // Create explanation
    let explanation = create_explanation(
        title,
        package_id,
        module_name,
        function_name,
        explanation_text,
        category,
        ctx
    );
    
    // Create registry
    let mut registry = create_explanation_registry(ctx);
    
    // Add explanation to registry
    add_to_registry(&mut registry, object::id(&explanation));
    
    (explanation, registry)
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(VMC {}, ctx);
}
