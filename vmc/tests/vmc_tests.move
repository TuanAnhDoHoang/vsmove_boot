#[test_only]
module vmc::vmc_tests;

use std::string;
use std::option;
use sui::object;
use sui::transfer;
use sui::test_scenario as ts;
use vmc::vmc::{Self, AdminCap, UserProfile, Explanation};

const ADMIN: address = @0xAD;
const USER1: address = @0x1;

#[test]
fun test_init_and_create_explanation() {
    let mut scenario = ts::begin(ADMIN);

    // Initialize the module
    {
        vmc::init_for_testing(ts::ctx(&mut scenario));
    };

    // User creates explanation
    ts::next_tx(&mut scenario, USER1);
    {
        let explanation = vmc::create_explanation(
            string::utf8(b"Test Explanation"),
            @0x123,
            string::utf8(b"test_module"),
            string::utf8(b"test_function"),
            string::utf8(b"This is a test explanation"),
            option::some(string::utf8(b"DeFi")),
            ts::ctx(&mut scenario),
        );
        assert!(object::id_to_address(&object::id(&explanation)) != @0x0, 0);
        transfer::public_transfer(explanation, USER1);
    };

    ts::end(scenario);
}

#[test]
fun test_rate_explanation() {
    let mut scenario = ts::begin(ADMIN);

    // Initialize and get admin cap
    {
        vmc::init_for_testing(ts::ctx(&mut scenario));
    };

    ts::next_tx(&mut scenario, USER1);
    {
        let explanation = vmc::create_explanation(
            string::utf8(b"Test Explanation"),
            @0x123,
            string::utf8(b"test_module"),
            string::utf8(b"test_function"),
            string::utf8(b"This is a test explanation"),
            option::none(),
            ts::ctx(&mut scenario),
        );
        transfer::public_transfer(explanation, USER1);
    };

    // Admin rates explanation
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut explanation = ts::take_from_address<Explanation>(&scenario, USER1);

        vmc::rate_explanation(
            &admin_cap,
            &mut explanation,
            5,
            ts::ctx(&mut scenario),
        );

        let (_, _, _, _, rating, votes, _) = vmc::get_explanation_info(&explanation);
        assert!(rating == 5, 0);
        assert!(votes == 1, 1);

        ts::return_to_sender(&scenario, admin_cap);
        transfer::public_transfer(explanation, USER1);
    };

    ts::end(scenario);
}
