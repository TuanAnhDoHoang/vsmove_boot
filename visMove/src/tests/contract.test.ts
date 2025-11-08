import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

test("Create Explaination", async () => {

    const pid = "0xf8bfd9c5714ab5701d912a402819205b603b605c236cfc0cb642d982d8aac7d2";
    const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

    const tx = new Transaction();
    tx.setGasBudget(1_000_000_000);
    const expl = tx.moveCall({
        target: `${pid}::vmc::create_explanation`,
        arguments: [
            tx.pure.string("unknow"),
            tx.pure.address("0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb"),
            tx.pure.string("acl"),
            tx.pure.string("new"),
            tx.pure.string("Mock explaination"),
            tx.pure.option("string", "unknow")
        ]
    });
    // suiClient.signAndExecuteTransaction({
    //     signer: 
    // })
})
