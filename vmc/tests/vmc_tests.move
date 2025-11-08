#[test_only]
module vmc::vmc_tests {
    use std::string;
    use std::option;
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::object;
    use vmc::vmc::{Self, AdminCap, ExplanationRegistry, Explanation, UserProfile};

    const ADMIN: address = @0xAD;
    const USER1: address = @0x1;
    const USER2: address = @0x2;

    #[test]
    fun test_init_and_create_explanation() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the module
        {
            vmc::init_for_testing(ts::ctx(&mut scenario));
        };

        // Admin creates an explanation
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let mut registry = ts::take_shared<ExplanationRegistry>(&scenario);
            
            let explanation_id = vmc::create_explanation(
                &admin_cap,
                &mut registry,
                string::utf8(b"Test Explanation"),
                @0x123,
                string::utf8(b"test_module"),
                string::utf8(b"test_function"),
                string::utf8(b"This is a test explanation"),
                ts::ctx(&mut scenario)
            );

            // Verify registry stats
            let (total_count, categories_count) = vmc::get_registry_stats(&registry);
            assert!(total_count == 1, 0);
            assert!(categories_count == 1, 1);

            // Verify explanation exists
            assert!(vmc::explanation_exists(&registry, explanation_id), 2);

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(registry);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_user_registration_and_preferences() {
        let mut scenario = ts::begin(USER1);
        
        // User registers
        {
            let user_id = vmc::register_user(
                string::utf8(b"testuser"),
                ts::ctx(&mut scenario)
            );
            assert!(object::id_to_address(&user_id) != @0x0, 0);
        };

        // User adds preferences
        ts::next_tx(&mut scenario, USER1);
        {
            let mut profile = ts::take_from_sender<UserProfile>(&scenario);
            
            vmc::add_user_preference(
                &mut profile,
                string::utf8(b"DeFi")
            );
            
            vmc::add_user_preference(
                &mut profile,
                string::utf8(b"NFT")
            );

            // Verify user info
            let (username, contributions, reputation) = vmc::get_user_info(&profile);
            assert!(username == string::utf8(b"testuser"), 1);
            assert!(contributions == 0, 2);
            assert!(reputation == 0, 3);

            // Verify preferences
            let preferences = vmc::get_user_preferences(&profile);
            assert!(vector::length(preferences) == 2, 4);

            ts::return_to_sender(&scenario, profile);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_explanation_rating() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize and create explanation
        {
            vmc::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let mut registry = ts::take_shared<ExplanationRegistry>(&scenario);
            
            vmc::create_explanation(
                &admin_cap,
                &mut registry,
                string::utf8(b"Test Explanation"),
                @0x123,
                string::utf8(b"test_module"),
                string::utf8(b"test_function"),
                string::utf8(b"This is a test explanation"),
                ts::ctx(&mut scenario)
            );

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(registry);
        };

        // User rates the explanation
        ts::next_tx(&mut scenario, USER1);
        {
            let mut explanation = ts::take_shared<Explanation>(&scenario);
            
            vmc::rate_explanation(
                &mut explanation,
                5,
                ts::ctx(&mut scenario)
            );

            let (_, _, _, _, rating, votes) = vmc::get_explanation_info(&explanation);
            assert!(rating == 5, 0);
            assert!(votes == 1, 1);

            ts::return_shared(explanation);
        };

        // Another user rates
        ts::next_tx(&mut scenario, USER2);
        {
            let mut explanation = ts::take_shared<Explanation>(&scenario);
            
            vmc::rate_explanation(
                &mut explanation,
                3,
                ts::ctx(&mut scenario)
            );

            let (_, _, _, _, rating, votes) = vmc::get_explanation_info(&explanation);
            assert!(rating == 4, 2); // (5 + 3) / 2 = 4
            assert!(votes == 2, 3);

            ts::return_shared(explanation);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_category_functionality() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            vmc::init_for_testing(ts::ctx(&mut scenario));
        };

        // Create explanations in different categories
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let mut registry = ts::take_shared<ExplanationRegistry>(&scenario);
            
            // Create explanation in "defi" category
            vmc::create_explanation(
                &admin_cap,
                &mut registry,
                string::utf8(b"DeFi Explanation"),
                @0x123,
                string::utf8(b"defi"),
                string::utf8(b"swap"),
                string::utf8(b"DeFi swap explanation"),
                ts::ctx(&mut scenario)
            );

            // Create explanation in "nft" category
            vmc::create_explanation(
                &admin_cap,
                &mut registry,
                string::utf8(b"NFT Explanation"),
                @0x456,
                string::utf8(b"nft"),
                string::utf8(b"mint"),
                string::utf8(b"NFT mint explanation"),
                ts::ctx(&mut scenario)
            );

            // Test category retrieval
            let mut defi_explanations = vmc::get_explanations_by_category(
                &registry,
                string::utf8(b"defi")
            );
            assert!(option::is_some(&defi_explanations), 0);
            
            let defi_list = option::extract(&mut defi_explanations);
            assert!(vector::length(&defi_list) == 1, 1);

            // Test non-existent category
            let empty_category = vmc::get_explanations_by_category(
                &registry,
                string::utf8(b"nonexistent")
            );
            assert!(option::is_none(&empty_category), 2);

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(registry);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_user_contribution_update() {
        let mut scenario = ts::begin(USER1);
        
        // Register user
        {
            vmc::register_user(
                string::utf8(b"contributor"),
                ts::ctx(&mut scenario)
            );
        };

        // Update contributions
        ts::next_tx(&mut scenario, USER1);
        {
            let mut profile = ts::take_from_sender<UserProfile>(&scenario);
            
            vmc::update_user_contribution(&mut profile, 10);
            vmc::update_user_contribution(&mut profile, 5);

            let (_, contributions, reputation) = vmc::get_user_info(&profile);
            assert!(contributions == 2, 0);
            assert!(reputation == 15, 1);

            ts::return_to_sender(&scenario, profile);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)]
    fun test_invalid_rating() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize and create explanation
        {
            vmc::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let mut registry = ts::take_shared<ExplanationRegistry>(&scenario);
            
            vmc::create_explanation(
                &admin_cap,
                &mut registry,
                string::utf8(b"Test"),
                @0x123,
                string::utf8(b"test"),
                string::utf8(b"test"),
                string::utf8(b"test"),
                ts::ctx(&mut scenario)
            );

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(registry);
        };

        // Try to rate with invalid rating (should fail)
        ts::next_tx(&mut scenario, USER1);
        {
            let mut explanation = ts::take_shared<Explanation>(&scenario);
            
            vmc::rate_explanation(
                &mut explanation,
                6, // Invalid rating > 5
                ts::ctx(&mut scenario)
            );

            ts::return_shared(explanation);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_admin_remove_explanation() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize and create explanation
        {
            vmc::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let mut registry = ts::take_shared<ExplanationRegistry>(&scenario);
            
            let explanation_id = vmc::create_explanation(
                &admin_cap,
                &mut registry,
                string::utf8(b"To be removed"),
                @0x123,
                string::utf8(b"test"),
                string::utf8(b"test"),
                string::utf8(b"test"),
                ts::ctx(&mut scenario)
            );

            // Verify it exists
            assert!(vmc::explanation_exists(&registry, explanation_id), 0);
            
            // Remove it
            vmc::remove_explanation(&admin_cap, &mut registry, explanation_id);
            
            // Verify it's removed
            assert!(!vmc::explanation_exists(&registry, explanation_id), 1);
            
            let (total_count, _) = vmc::get_registry_stats(&registry);
            assert!(total_count == 0, 2);

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(registry);
        };

        ts::end(scenario);
    }
}