# VMC Smart Contract Integration

## Overview
Complete smart contract system for Contract Clarity with all required features:

### ✅ Smart Contract Features Implemented:

1. **Vectors**: `ExplanationRegistry.explanations` and category management
2. **Option<T>**: `get_explanations_by_category()` returns `Option<vector<ID>>`
3. **Shared Object**: `ExplanationRegistry` is shared across all users
4. **Dynamic Fields**: User preferences stored as dynamic fields in `UserProfile`
5. **Events**: `ExplanationCreated`, `ExplanationRated`, `UserRegistered`
6. **Access Control**: `AdminCap` capability pattern for admin functions
7. **Display Object**: Custom display for `Explanation` objects

### ✅ Move Tests:
- Comprehensive test suite in `vmc_tests.move`
- Tests all major functionality including error cases
- Integration tests for complex workflows

### ✅ Frontend Integration:
- Sui wallet adapter integration
- On-chain interactions (create, rate explanations)
- Real-time data reading from blockchain
- Smart contract state management

### ✅ Jest Integration Tests:
- Complete test coverage for React components
- Mocked blockchain interactions
- Error handling and edge cases

## Quick Start

1. **Deploy Smart Contract**:
```bash
cd vmc
sui move build
sui move test
sui client publish --gas-budget 100000000
```

2. **Setup Frontend**:
```bash
cd visMove
npm install
npm test
npm run dev
```

3. **Or use the automated script**:
```bash
chmod +x deploy-and-test.sh
./deploy-and-test.sh
```

## Environment Variables
Add to `.env.local`:
```
NEXT_PUBLIC_PACKAGE_ID=your_deployed_package_id
NEXT_PUBLIC_REGISTRY_ID=your_registry_object_id
```

## Key Components

- **Smart Contract**: `vmc/sources/vmc.move` - Main contract with all features
- **Tests**: `vmc/tests/vmc_tests.move` - Comprehensive Move tests  
- **Frontend**: `visMove/src/components/contract/contract-explainer.tsx` - Integrated UI
- **Integration Tests**: `visMove/src/components/contract/contract-explainer.test.tsx` - Jest tests

The system now fully meets all requirements with working smart contract, comprehensive tests, and integrated frontend!