import {
  AccountInfo,
  AddressLookupTableAccount,
  AddressLookupTableProgram,
  Connection,
  PublicKey,
} from '@solana/web3.js'; 
import { retrieveEnvVariable } from './utils';


const rpcUrl = retrieveEnvVariable("RPC_URL");
const connection = new Connection(rpcUrl, { commitment: "processed" });
/**
 * this class solves 2 problems:
 * 1. cache and geyser subscribe to lookup tables for fast retreival
 * 2. compute the ideal lookup tables for a set of addresses
 * 
 * the second problem/solution is needed because jito bundles can not include a a txn that uses a lookup table
 * that has been modified in the same bundle. so this class caches all lookups and then computes the ideal lookup tables
 * for a set of addresses used by the arb txn so that the arb txn size is reduced below the maximum.
 */
class LookupTableProvider {
  lookupTables: Map<string, AddressLookupTableAccount> |any;
  addressesForLookupTable: Map<string, Set<string>>|any;
  lookupTablesForAddress: Map<string, Set<string>>|any;
 
  constructor() {
    this.lookupTables = new Map();
    this.lookupTablesForAddress = new Map();
    this.addressesForLookupTable = new Map(); 
  }


    return selectedTables;
  }
}

const lookupTableProvider = new LookupTableProvider();

lookupTableProvider.getLookupTable(
  // custom lookup tables
  new PublicKey('Gr8rXuDwE2Vd2F5tifkPyMaUR67636YgrZEjkJf9RR9V'),
);

export { lookupTableProvider };