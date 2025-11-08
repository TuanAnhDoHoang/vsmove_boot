/// Legacy explanation module - kept for backward compatibility
module vmc::explain {
    use std::string::String;
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use vmc::vmc;

    /// Legacy explanation struct
    public struct Explanation has key, store {
        id: UID,
        name: String,
        package_id: address,
        module_name: String,
        function_name: String,
    }

    /// Create new explanation using the main vmc module
    public fun create_explanation_wrapper(
        admin_cap: &vmc::AdminCap,
        registry: &mut vmc::ExplanationRegistry,
        name: String,
        package_id: address,
        module_name: String,
        function_name: String,
        explanation_text: String,
        ctx: &mut TxContext
    ) {
        vmc::create_explanation(
            admin_cap,
            registry,
            name,
            package_id,
            module_name,
            function_name,
            explanation_text,
            ctx
        );
    }

    /// Legacy function for backward compatibility
    public fun new_explanation(
        name: String,
        package_id: address,
        module_name: String,
        function_name: String,
        ctx: &mut TxContext 
    ): Explanation {
        Explanation {
            id: object::new(ctx),
            name,
            package_id,
            module_name,
            function_name,
        }
    }

    /// Get explanation info
    public fun get_explanation_details(explanation: &Explanation): (String, address, String, String) {
        (explanation.name, explanation.package_id, explanation.module_name, explanation.function_name)
    }
}
