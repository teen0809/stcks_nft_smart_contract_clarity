
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.28.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Deployer can mint nft",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let nonDeployer = accounts.get('wallet_1')!;
        let recipient = accounts.get('wallet_2')!;

        let block = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'mint',
                [], 
                deployer.address),
            Tx.contractCall(
                'arkadroids', 
                'mint', 
                [],
                nonDeployer.address)
        ]);

        block.receipts[0].result.expectOk().expectUint(2);
        block.receipts[1].result.expectErr().expectUint(103);
        
        let lastTokenId = chain.callReadOnlyFn(
            'arkadroids', 
            'get-last-token-id', 
            [], 
            deployer.address);

        lastTokenId.result.expectOk().expectUint(1);
        
        let tokenOwner = chain.callReadOnlyFn(
            'arkadroids', 
            'get-owner', 
            [types.uint(1)], 
            deployer.address);

        tokenOwner.result.expectOk().expectSome().expectPrincipal(deployer.address);

        chain.callReadOnlyFn(
            'arkadroids', 
            'get-owner', 
            [types.uint(2)], 
            deployer.address).result.expectOk().expectNone();
    }
});

Clarinet.test({
    name: "Nft owner only can transfer the nft",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get("wallet_1")!;
        let wallet_2 = accounts.get("wallet_2")!;

        let mintingBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'mint',
                [], 
                deployer.address)
        ]);

        mintingBlock.receipts[0].result.expectOk().expectUint(2);

        let call = chain.callReadOnlyFn(
            "arkadroids",
            "get-balance",
            [types.principal(deployer.address)],
            deployer.address
        );
        call.result.expectUint(1);

        let transferBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'transfer', 
                [types.uint(1), types.principal(deployer.address), types.principal(wallet_1.address)], 
                wallet_1.address),
            Tx.contractCall(
                'arkadroids', 
                'transfer', 
                [types.uint(1), types.principal(wallet_1.address), types.principal(wallet_2.address)], 
                wallet_1.address),
            Tx.contractCall(
                'arkadroids', 
                'transfer', 
                [types.uint(1), types.principal(deployer.address), types.principal(wallet_1.address)], 
                deployer.address),
            Tx.contractCall(
                'arkadroids', 
                'transfer', 
                [types.uint(1), types.principal(wallet_1.address), types.principal(wallet_2.address)], 
                wallet_1.address)
        ]);

        transferBlock.receipts[0].result.expectErr().expectUint(101);
        transferBlock.receipts[1].result.expectErr().expectUint(101);
        transferBlock.receipts[2].result.expectOk();
        transferBlock.receipts[3].result.expectOk();

        call = chain.callReadOnlyFn(
            "arkadroids",
            "get-balance",
            [types.principal(deployer.address)],
            deployer.address
        );
        call.result.expectUint(0);

        call = chain.callReadOnlyFn(
            "arkadroids",
            "get-balance",
            [types.principal(wallet_2.address)],
            deployer.address
        );
        call.result.expectUint(1);
    }
});

Clarinet.test({
    name: "Only admin user can set curator",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;
        let wallet_2 = accounts.get('wallet_2')!;

        let deployerBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'set-curator-address', 
                [types.principal(wallet_1.address)], 
                wallet_1.address),
            Tx.contractCall(
                'arkadroids', 
                'set-curator-address', 
                [types.principal(wallet_1.address)], 
                deployer.address)
        ]);
        
        deployerBlock.receipts[0].result.expectErr().expectUint(103);
        deployerBlock.receipts[1].result.expectOk().expectBool(true);

        let curatorBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'set-curator-address', 
                [types.principal(wallet_2.address)], 
                wallet_2.address),
            Tx.contractCall(
                'arkadroids', 
                'set-curator-address', 
                [types.principal(wallet_2.address)], 
                wallet_1.address)
        ]);

        curatorBlock.receipts[0].result.expectErr().expectUint(103);
        curatorBlock.receipts[1].result.expectOk().expectBool(true);

    }
});

Clarinet.test({
    name: "Only admin user can freeze metadata",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;
        let wallet_2 = accounts.get('wallet_2')!;

        let deployerBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'freeze-metadata', 
                [], 
                wallet_1.address),
            Tx.contractCall(
                'arkadroids', 
                'freeze-metadata', 
                [], 
                deployer.address)
        ]);
        
        deployerBlock.receipts[0].result.expectErr().expectUint(103);
        deployerBlock.receipts[1].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Only admin user can set base uri",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let deployerBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'set-base-uri', 
                [types.ascii("ipfs://QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3N0/")], 
                wallet_1.address),
            Tx.contractCall(
                'arkadroids', 
                'set-base-uri', 
                [types.ascii("ipfs://QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3N0/")], 
                deployer.address)
        ]);
        
        deployerBlock.receipts[0].result.expectErr().expectUint(103);
        deployerBlock.receipts[1].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Only can set base uri if metadata is not frozen",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let deployerBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'set-base-uri', 
                [types.ascii("ipfs://QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3N0/")], 
                deployer.address),
            Tx.contractCall(
                'arkadroids', 
                'freeze-metadata', 
                [], 
                deployer.address),
            Tx.contractCall(
                'arkadroids', 
                'set-base-uri',
                [types.ascii("ipfs://QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3N8/")], 
                deployer.address)
        ]);
        
        deployerBlock.receipts[0].result.expectOk().expectBool(true);
        deployerBlock.receipts[1].result.expectOk().expectBool(true);
        deployerBlock.receipts[2].result.expectErr().expectUint(111);
    }
});

Clarinet.test({
    name: "Get base uri",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let deployerBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'set-base-uri', 
                [types.ascii("ipfs://test/")], 
                deployer.address)
        ]);
        deployerBlock.receipts[0].result.expectOk().expectBool(true);

        let uri = chain.callReadOnlyFn(
            'arkadroids', 
            'get-token-uri', 
            [types.uint(1)], 
            deployer.address);
        
        uri.result.expectOk().expectSome().expectAscii("ipfs://test/{id}.json");
    }
});

Clarinet.test({
    name: "Deployer can mint all 120",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let nonDeployer = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'mint-all', 
                [], 
                deployer.address),
            Tx.contractCall(
                'arkadroids', 
                'mint-all', 
                [], 
                nonDeployer.address)
        ]);
        
        block.receipts[0].result.expectOk().expectUint(121);
        block.receipts[1].result.expectErr().expectUint(103);
        
        let lastTokenId = chain.callReadOnlyFn(
            'arkadroids', 
            'get-last-token-id', 
            [], 
            deployer.address);

        lastTokenId.result.expectOk().expectUint(120);

        block = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'mint',
                [], 
                deployer.address)
        ]);

        block.receipts[0].result.expectErr().expectUint(102);
    }
});

Clarinet.test({
    name: "List, unlist and buy Arkadroids on market",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get("wallet_1")!;

        let mintingBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'mint',
                [], 
                deployer.address)
        ]);

        mintingBlock.receipts[0].result.expectOk();
  
        let listingBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids',
                'list-in-ustx', 
                [   types.uint(1),
                    types.uint(100000000),
                    types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadroids-gamma-commission')
                ],
                deployer.address)
        ]);
        listingBlock.receipts[0].result.expectOk().expectBool(true);
  
        let unlistBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids',
                'unlist-in-ustx', 
                [
                    types.uint(1)
                ], 
                wallet_1.address)
        ]);
        unlistBlock.receipts[0].result.expectErr().expectUint(101);
  
        unlistBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids',
                'unlist-in-ustx', 
                [
                    types.uint(1)
                ], 
                deployer.address)
        ]);
        unlistBlock.receipts[0].result.expectOk().expectBool(true);

        listingBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids',
                'list-in-ustx', 
                [   types.uint(1),
                    types.uint(100000000),
                    types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadroids-gamma-commission')
                ],
                deployer.address)
        ]);
        listingBlock.receipts[0].result.expectOk().expectBool(true);

        let buyBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids',
                'buy-in-ustx', 
                [   types.uint(2),
                    types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadroids-gamma-commission')
                ],
                wallet_1.address),
            Tx.contractCall(
                'arkadroids',
                'buy-in-ustx', 
                [   types.uint(1),
                    types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadroids-test-commission')
                ],
                wallet_1.address),
            Tx.contractCall(
                'arkadroids',
                'buy-in-ustx', 
                [   types.uint(1),
                    types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadroids-gamma-commission')
                ],
                wallet_1.address),
            Tx.contractCall(
                'arkadroids',
                'buy-in-ustx', 
                [   types.uint(1),
                    types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadroids-gamma-commission')
                ],
                wallet_1.address)
        ]);
        buyBlock.receipts[0].result.expectErr().expectUint(108);
        buyBlock.receipts[1].result.expectErr().expectUint(107);
        buyBlock.receipts[2].result.expectOk().expectBool(true);
        buyBlock.receipts[3].result.expectErr().expectUint(106);

        let commision = (25 * 100000000) / 1000
        let royalty = (50 * 100000000) / 1000

        buyBlock.receipts[2].events.expectSTXTransferEvent(commision, wallet_1.address, 'SPNWZ5V2TPWGQGVDR6T7B6RQ4XMGZ4PXTEE0VQ0S')
        buyBlock.receipts[2].events.expectSTXTransferEvent(royalty, wallet_1.address, 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR')
    }
  });

  Clarinet.test({
    name: "Can't transfer Arkadroids while listed on market",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get("wallet_1")!;
        let potentialBuyer = accounts.get("wallet_2")!;

        let mintingBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'mint',
                [], 
                deployer.address)
        ]);

        mintingBlock.receipts[0].result.expectOk();
  
        let listingBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids',
                'list-in-ustx', 
                [   types.uint(1),
                    types.uint(100000000),
                    types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.arkadroids-gamma-commission')
                ],
                deployer.address)
        ]);
        listingBlock.receipts[0].result.expectOk().expectBool(true);

        let listingCall = chain.callReadOnlyFn(
            'arkadroids', 
            'get-listing-in-ustx', 
            [types.uint(1)], 
            potentialBuyer.address);

        listingCall.result.expectSome().expectTuple()["price"].expectUint(100000000);

        let transferBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'transfer', 
                [types.uint(1), types.principal(deployer.address), types.principal(wallet_1.address)], 
                deployer.address),
            Tx.contractCall(
                'arkadroids', 
                'transfer', 
                [types.uint(5), types.principal(deployer.address), types.principal(wallet_1.address)], 
                deployer.address)
        ]);

        transferBlock.receipts[0].result.expectErr().expectUint(105);
        transferBlock.receipts[1].result.expectErr().expectUint(101);

        let unlistBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids',
                'unlist-in-ustx', 
                [
                    types.uint(1)
                ], 
                deployer.address)
        ]);
        unlistBlock.receipts[0].result.expectOk().expectBool(true);

        transferBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'transfer', 
                [types.uint(1), types.principal(deployer.address), types.principal(wallet_1.address)], 
                deployer.address)
        ]);

        transferBlock.receipts[0].result.expectOk();
    }
  });

  Clarinet.test({
    name: "Only owner can burn",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get("wallet_1")!;

        let mintingBlock = chain.mineBlock([
            Tx.contractCall(
                'arkadroids', 
                'mint',
                [], 
                deployer.address),
            Tx.contractCall(
                'arkadroids', 
                'burn',
                [types.uint(1)], 
                wallet_1.address),
            Tx.contractCall(
                'arkadroids', 
                'burn',
                [types.uint(1)], 
                deployer.address)
        ]);

        mintingBlock.receipts[0].result.expectOk();
        mintingBlock.receipts[1].result.expectErr().expectUint(101);
        mintingBlock.receipts[2].result.expectOk();
    }
  });