import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContractExplainer from '@/components/contract/contract-explainer';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useNetwork } from '@/hooks/NetworkContext';
import { getFunctionExplanation } from '@/lib/actions';

// Mock dependencies
jest.mock('@mysten/dapp-kit');
jest.mock('@/hooks/NetworkContext');
jest.mock('@/lib/actions');
jest.mock('@/components/contract/getMoveCode');

const mockUseCurrentAccount = useCurrentAccount as jest.MockedFunction<typeof useCurrentAccount>;
const mockUseSignAndExecuteTransaction = useSignAndExecuteTransaction as jest.MockedFunction<typeof useSignAndExecuteTransaction>;
const mockUseSuiClient = useSuiClient as jest.MockedFunction<typeof useSuiClient>;
const mockUseNetwork = useNetwork as jest.MockedFunction<typeof useNetwork>;
const mockGetFunctionExplanation = getFunctionExplanation as jest.MockedFunction<typeof getFunctionExplanation>;

// Mock toast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock getMoveCode functions
jest.mock('@/components/contract/getMoveCode', () => ({
  getPackageMove: jest.fn().mockResolvedValue(new Map([
    ['test_module', 'public fun test_function() { }']
  ])),
  getModuleMove: jest.fn().mockReturnValue('public fun test_function() { }')
}));

describe('ContractExplainer Integration Tests', () => {
  const mockAccount = {
    address: '0x123456789abcdef',
    publicKey: new Uint8Array(),
    chains: []
  };

  const mockSuiClient = {
    getOwnedObjects: jest.fn(),
    getObject: jest.fn()
  };

  const mockSignAndExecute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseCurrentAccount.mockReturnValue(mockAccount);
    mockUseSuiClient.mockReturnValue(mockSuiClient as any);
    mockUseSignAndExecuteTransaction.mockReturnValue({ mutate: mockSignAndExecute });
    mockUseNetwork.mockReturnValue({ currNetwork: 'testnet' });
    
    mockGetFunctionExplanation.mockResolvedValue({
      data: {
        explanation: 'Test explanation',
        coinFlow: 'No coin flow',
        umlSequenceDiagram: '@startuml\nTest -> Diagram\n@enduml',
        conceptsToExplain: ['concept1', 'concept2']
      }
    });
  });

  it('renders contract explainer with wallet connected', () => {
    render(<ContractExplainer />);
    
    expect(screen.getByText('Explain a Smart Contract')).toBeInTheDocument();
    expect(screen.getByText(/Connected:/)).toBeInTheDocument();
    expect(screen.getByText('0x123456...bcdef')).toBeInTheDocument();
  });

  it('handles contract parsing and module selection', async () => {
    render(<ContractExplainer />);
    
    const packageInput = screen.getByPlaceholderText(/0x1eabed72/);
    const parseButton = screen.getByText('Parse Contract');
    
    fireEvent.change(packageInput, { 
      target: { value: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb' } 
    });
    fireEvent.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Contract Modules')).toBeInTheDocument();
    });
  });

  it('generates explanation for selected function', async () => {
    render(<ContractExplainer />);
    
    // Simulate contract parsing
    const packageInput = screen.getByPlaceholderText(/0x1eabed72/);
    fireEvent.change(packageInput, { 
      target: { value: '0x123' } 
    });
    fireEvent.click(screen.getByText('Parse Contract'));
    
    await waitFor(() => {
      const moduleButton = screen.getByText('test_module');
      fireEvent.click(moduleButton);
    });
    
    await waitFor(() => {
      const functionButton = screen.getByText('test_function');
      fireEvent.click(functionButton);
    });
    
    await waitFor(() => {
      expect(mockGetFunctionExplanation).toHaveBeenCalledWith({
        contractCode: 'public fun test_function() { }',
        functionName: 'test_function'
      });
      expect(screen.getByText('Test explanation')).toBeInTheDocument();
    });
  });

  it('saves explanation to blockchain when upload button clicked', async () => {
    render(<ContractExplainer />);
    
    // Setup: Parse contract and generate explanation
    const packageInput = screen.getByPlaceholderText(/0x1eabed72/);
    fireEvent.change(packageInput, { target: { value: '0x123' } });
    fireEvent.click(screen.getByText('Parse Contract'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('test_module'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('test_function'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test explanation')).toBeInTheDocument();
    });
    
    // Click upload button
    const uploadButton = screen.getByTitle('Save to blockchain');
    fireEvent.click(uploadButton);
    
    expect(mockSignAndExecute).toHaveBeenCalled();
    const callArgs = mockSignAndExecute.mock.calls[0][0];
    expect(callArgs.transaction).toBeDefined();
  });

  it('handles rating submission', async () => {
    render(<ContractExplainer />);
    
    // Setup: Generate explanation first
    const packageInput = screen.getByPlaceholderText(/0x1eabed72/);
    fireEvent.change(packageInput, { target: { value: '0x123' } });
    fireEvent.click(screen.getByText('Parse Contract'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('test_module'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('test_function'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Rate this explanation:')).toBeInTheDocument();
    });
    
    // Click 5-star rating
    const fiveStarButton = screen.getByText('5 ⭐');
    fireEvent.click(fiveStarButton);
    
    expect(mockSignAndExecute).toHaveBeenCalled();
  });

  it('displays error when wallet not connected for blockchain operations', async () => {
    mockUseCurrentAccount.mockReturnValue(null);
    
    render(<ContractExplainer />);
    
    // Try to access blockchain features without wallet
    expect(screen.queryByText(/Connected:/)).not.toBeInTheDocument();
  });

  it('handles view mode switching between Function and Coin flow', async () => {
    render(<ContractExplainer />);
    
    // Generate explanation first
    const packageInput = screen.getByPlaceholderText(/0x1eabed72/);
    fireEvent.change(packageInput, { target: { value: '0x123' } });
    fireEvent.click(screen.getByText('Parse Contract'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('test_module'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('test_function'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Function')).toBeInTheDocument();
      expect(screen.getByText('Coin flow')).toBeInTheDocument();
    });
    
    // Switch to coin flow view
    fireEvent.click(screen.getByText('Coin flow'));
    
    await waitFor(() => {
      expect(screen.getByText('No coin flow')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockGetFunctionExplanation.mockResolvedValue({
      error: 'API Error occurred'
    });
    
    render(<ContractExplainer />);
    
    const packageInput = screen.getByPlaceholderText(/0x1eabed72/);
    fireEvent.change(packageInput, { target: { value: '0x123' } });
    fireEvent.click(screen.getByText('Parse Contract'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('test_module'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('test_function'));
    });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Explanation Failed',
        description: 'API Error occurred'
      });
    });
  });

  it('validates package ID format', () => {
    render(<ContractExplainer />);
    
    const packageInput = screen.getByPlaceholderText(/0x1eabed72/);
    const parseButton = screen.getByText('Parse Contract');
    
    // Test with invalid package ID
    fireEvent.change(packageInput, { target: { value: 'invalid' } });
    fireEvent.click(parseButton);
    
    // Should not proceed without valid package ID format
    expect(screen.queryByText('Contract Modules')).not.toBeInTheDocument();
  });

  it('loads user owned objects when wallet connected', async () => {
    mockSuiClient.getOwnedObjects.mockResolvedValue({
      data: [
        {
          data: {
            objectId: '0xabc123',
            content: {
              fields: {
                username: 'testuser',
                contributions: '5',
                reputation: '100'
              }
            }
          }
        }
      ]
    });
    
    render(<ContractExplainer />);
    
    await waitFor(() => {
      expect(mockSuiClient.getOwnedObjects).toHaveBeenCalledWith({
        owner: mockAccount.address,
        filter: {
          StructType: expect.stringContaining('::vmc::UserProfile')
        },
        options: {
          showContent: true,
          showType: true
        }
      });
    });
  });
});