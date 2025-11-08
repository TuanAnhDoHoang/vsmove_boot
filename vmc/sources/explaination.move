// module vmc::explain;

// use std::string::String;
// use sui::table::Table;
// use sui::tx_context::TxContext;

// public struct Explaination has key, store {
//     id: UID,
//     name: String, //title: example: Centus
//     package_id: address,
//     module_name: String,
//     function_name: String,
// }

// public fun new_Explanation(
//     name: String, //title: example: Centus
//     package_id: address,
//     module_name: String,
//     function_name: String,
//     ctx: &mut TxContext,
// ): Explaination {
//     Explaination {
//         id: object::new(ctx),
//         name,
//         package_id,
//         module_name,
//         function_name,
//     }
// }

// public struct ExplainationRegistry has key {
//     id: UID,
//     explains: Table<String, vector<Explaination>>,
// }

// public fun new_explaination_registry(ctx: &mut TxContext): ExplainationRegistry {
//     ExplainationRegistry {
//         id: object::new(ctx),
//         explains: sui::table::new<String, vector<Explaination>>(),
//     }
// }

// public fun add_to_registry(registry: &mut ExplainationRegistry, expl: Explaination) {
//     let exist_expl = registry.explains.borrow_mut(expl.name);
//     exist_expl.push_back(expl);
// }

// // public fun borrow_expl_from_registry(registry: &mut ExplainationRegistry, name: String, id: ): &Explaination{

// // }
