import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { ContractService, ExplanationData, UserProfileData } from '@/services/contractService';
import { useAppStore } from '@/store/appStore';
import { useCallback, useEffect, useMemo } from 'react';

export function useContractService() {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const { 
    setUserProfile, 
    setExplanations, 
    addExplanation,
    setIsLoading,
    addNotification 
  } = useAppStore();

  const contractService = useMemo(() => new ContractService(suiClient), [suiClient]);

  // Load user data when account changes
  useEffect(() => {
    if (account?.address) {
      loadUserData();
      loadUserExplanations();
    } else {
      setUserProfile(null);
      setExplanations([]);
    }
  }, [account?.address]);

  const loadUserData = useCallback(async () => {
    if (!account?.address) return;
    
    try {
      setIsLoading(true);
      const profile = await contractService.getUserProfile(account.address);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user data:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load user profile'
      });
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, contractService, setUserProfile, setIsLoading, addNotification]);

  const loadUserExplanations = useCallback(async () => {
    if (!account?.address) return;
    
    try {
      const explanations = await contractService.getUserExplanations(account.address);
      setExplanations(explanations);
    } catch (error) {
      console.error('Error loading explanations:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load explanations'
      });
    }
  }, [account?.address, contractService, setExplanations, addNotification]);

  const createExplanation = useCallback(async (
    title: string,
    packageId: string,
    moduleName: string,
    functionName: string,
    explanationText: string
  ) => {
    if (!account?.address) {
      addNotification({
        type: 'error',
        message: 'Please connect your wallet first'
      });
      return null;
    }

    try {
      setIsLoading(true);
      const tx = contractService.createExplanationTx(
        title,
        packageId,
        moduleName,
        functionName,
        explanationText
      );
      
      // Return transaction for signing
      return tx;
    } catch (error) {
      console.error('Error creating explanation:', error);
      addNotification({
        type: 'error',
        message: 'Failed to create explanation'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, contractService, setIsLoading, addNotification]);

  const rateExplanation = useCallback(async (explanationId: string, rating: number) => {
    if (!account?.address) {
      addNotification({
        type: 'error',
        message: 'Please connect your wallet first'
      });
      return null;
    }

    try {
      setIsLoading(true);
      const tx = contractService.rateExplanationTx(explanationId, rating);
      return tx;
    } catch (error) {
      console.error('Error rating explanation:', error);
      addNotification({
        type: 'error',
        message: 'Failed to rate explanation'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, contractService, setIsLoading, addNotification]);

  const registerUser = useCallback(async (username: string) => {
    if (!account?.address) {
      addNotification({
        type: 'error',
        message: 'Please connect your wallet first'
      });
      return null;
    }

    try {
      setIsLoading(true);
      const tx = contractService.registerUserTx(username);
      return tx;
    } catch (error) {
      console.error('Error registering user:', error);
      addNotification({
        type: 'error',
        message: 'Failed to register user'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, contractService, setIsLoading, addNotification]);

  const getRegistryStats = useCallback(async () => {
    try {
      return await contractService.getRegistryStats();
    } catch (error) {
      console.error('Error getting registry stats:', error);
      return { totalCount: 0, categoriesCount: 0 };
    }
  }, [contractService]);

  return {
    contractService,
    loadUserData,
    loadUserExplanations,
    createExplanation,
    rateExplanation,
    registerUser,
    getRegistryStats,
    isConnected: !!account?.address,
    userAddress: account?.address,
  };
}