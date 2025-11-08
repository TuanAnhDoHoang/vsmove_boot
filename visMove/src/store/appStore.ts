import { useState } from 'react';
import { ExplanationData, UserProfileData } from '@/services/contractService';

// Simple state management without context
let globalState = {
  userProfile: null as UserProfileData | null,
  explanations: [] as ExplanationData[],
  isLoading: false,
  theme: 'light' as 'light' | 'dark',
  selectedNetwork: 'testnet',
  searchQuery: '',
  selectedCategory: null as string | null,
};

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function useAppStore() {
  const [, forceUpdate] = useState({});
  
  // Subscribe to state changes
  const rerender = () => forceUpdate({});
  listeners.add(rerender);
  
  return {
    ...globalState,
    setUserProfile: (profile: UserProfileData | null) => {
      globalState.userProfile = profile;
      notifyListeners();
    },
    setExplanations: (explanations: ExplanationData[]) => {
      globalState.explanations = explanations;
      notifyListeners();
    },
    addExplanation: (explanation: ExplanationData) => {
      globalState.explanations = [...globalState.explanations, explanation];
      notifyListeners();
    },
    setIsLoading: (loading: boolean) => {
      globalState.isLoading = loading;
      notifyListeners();
    },
    setTheme: (theme: 'light' | 'dark') => {
      globalState.theme = theme;
      notifyListeners();
    },
    setSelectedNetwork: (network: string) => {
      globalState.selectedNetwork = network;
      notifyListeners();
    },
    setSearchQuery: (query: string) => {
      globalState.searchQuery = query;
      notifyListeners();
    },
    setSelectedCategory: (category: string | null) => {
      globalState.selectedCategory = category;
      notifyListeners();
    },
    addNotification: (notification: { type: string; message: string }) => {
      console.log(`${notification.type}: ${notification.message}`);
    },
  };
}