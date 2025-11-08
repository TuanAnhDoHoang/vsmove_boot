export const CONTRACT_CONFIG = {
  PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0',
  REGISTRY_ID: process.env.NEXT_PUBLIC_REGISTRY_ID || '0x0',
  ADMIN_CAP_ID: process.env.NEXT_PUBLIC_ADMIN_CAP_ID || '0x0',
  NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet',
  RPC_URL: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
};

export const MODULES = {
  VMC: `${CONTRACT_CONFIG.PACKAGE_ID}::vmc`,
  EXPLAIN: `${CONTRACT_CONFIG.PACKAGE_ID}::explain`,
};

export const FUNCTIONS = {
  CREATE_EXPLANATION: `${MODULES.VMC}::create_explanation`,
  RATE_EXPLANATION: `${MODULES.VMC}::rate_explanation`,
  REGISTER_USER: `${MODULES.VMC}::register_user`,
  ADD_USER_PREFERENCE: `${MODULES.VMC}::add_user_preference`,
  UPDATE_USER_CONTRIBUTION: `${MODULES.VMC}::update_user_contribution`,
  GET_EXPLANATIONS_BY_CATEGORY: `${MODULES.VMC}::get_explanations_by_category`,
  GET_EXPLANATION_INFO: `${MODULES.VMC}::get_explanation_info`,
  GET_USER_INFO: `${MODULES.VMC}::get_user_info`,
};

export const STRUCT_TYPES = {
  EXPLANATION: `${MODULES.VMC}::Explanation`,
  USER_PROFILE: `${MODULES.VMC}::UserProfile`,
  EXPLANATION_REGISTRY: `${MODULES.VMC}::ExplanationRegistry`,
  ADMIN_CAP: `${MODULES.VMC}::AdminCap`,
};

export const ERROR_CODES = {
  NOT_AUTHORIZED: 1,
  EXPLANATION_NOT_FOUND: 2,
  INVALID_RATING: 3,
};

export const RATING_RANGE = {
  MIN: 1,
  MAX: 5,
};

export const CATEGORIES = [
  'DeFi',
  'NFT',
  'Gaming',
  'Infrastructure',
  'Governance',
  'Utility',
  'Social',
  'Other'
] as const;

export type Category = typeof CATEGORIES[number];