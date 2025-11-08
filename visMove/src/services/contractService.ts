import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { CONTRACT_CONFIG, FUNCTIONS, STRUCT_TYPES } from '@/config/contracts';

export interface ExplanationData {
  id: string;
  title: string;
  packageId: string;
  moduleName: string;
  functionName: string;
  explanationText: string;
  author: string;
  rating: number;
  votes: number;
  createdAt: number;
}

export interface UserProfileData {
  id: string;
  username: string;
  contributions: number;
  reputation: number;
  preferences: string[];
}

export class ContractService {
  constructor(private suiClient: SuiClient) {}

  // Create explanation transaction
  createExplanationTx(
    title: string,
    packageId: string,
    moduleName: string,
    functionName: string,
    explanationText: string
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: FUNCTIONS.CREATE_EXPLANATION,
      arguments: [
        tx.object(CONTRACT_CONFIG.ADMIN_CAP_ID),
        tx.object(CONTRACT_CONFIG.REGISTRY_ID),
        tx.pure.string(title),
        tx.pure.address(packageId),
        tx.pure.string(moduleName),
        tx.pure.string(functionName),
        tx.pure.string(explanationText),
      ],
    });

    return tx;
  }

  // Rate explanation transaction
  rateExplanationTx(explanationId: string, rating: number): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: FUNCTIONS.RATE_EXPLANATION,
      arguments: [
        tx.object(explanationId),
        tx.pure.u64(rating),
      ],
    });

    return tx;
  }

  // Register user transaction
  registerUserTx(username: string): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: FUNCTIONS.REGISTER_USER,
      arguments: [
        tx.pure.string(username),
      ],
    });

    return tx;
  }

  // Add user preference transaction
  addUserPreferenceTx(profileId: string, preference: string): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: FUNCTIONS.ADD_USER_PREFERENCE,
      arguments: [
        tx.object(profileId),
        tx.pure.string(preference),
      ],
    });

    return tx;
  }

  // Get user's explanations
  async getUserExplanations(userAddress: string): Promise<ExplanationData[]> {
    try {
      const ownedObjects = await this.suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: STRUCT_TYPES.EXPLANATION,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return ownedObjects.data
        .map(obj => {
          if (obj.data?.content && 'fields' in obj.data.content) {
            const fields = obj.data.content.fields as any;
            return {
              id: obj.data.objectId,
              title: fields.title,
              packageId: fields.package_id,
              moduleName: fields.module_name,
              functionName: fields.function_name,
              explanationText: fields.explanation_text,
              author: fields.author,
              rating: parseInt(fields.rating),
              votes: parseInt(fields.votes),
              createdAt: parseInt(fields.created_at),
            };
          }
          return null;
        })
        .filter(Boolean) as ExplanationData[];
    } catch (error) {
      console.error('Error fetching user explanations:', error);
      return [];
    }
  }

  // Get user profile
  async getUserProfile(userAddress: string): Promise<UserProfileData | null> {
    try {
      const ownedObjects = await this.suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: STRUCT_TYPES.USER_PROFILE,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (ownedObjects.data.length === 0) return null;

      const profileObject = ownedObjects.data[0];
      if (profileObject.data?.content && 'fields' in profileObject.data.content) {
        const fields = profileObject.data.content.fields as any;
        
        // Get dynamic field for preferences
        let preferences: string[] = [];
        try {
          const dynamicFields = await this.suiClient.getDynamicFields({
            parentId: profileObject.data.objectId,
          });
          
          for (const field of dynamicFields.data) {
            if (field.name.value === 'preferences') {
              const fieldObject = await this.suiClient.getDynamicFieldObject({
                parentId: profileObject.data.objectId,
                name: field.name,
              });
              
              if (fieldObject.data?.content && 'fields' in fieldObject.data.content) {
                preferences = (fieldObject.data.content.fields as any).value || [];
              }
            }
          }
        } catch (error) {
          console.warn('Could not fetch user preferences:', error);
        }

        return {
          id: profileObject.data.objectId,
          username: fields.username,
          contributions: parseInt(fields.contributions),
          reputation: parseInt(fields.reputation),
          preferences,
        };
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    
    return null;
  }

  // Get registry statistics
  async getRegistryStats(): Promise<{ totalCount: number; categoriesCount: number }> {
    try {
      const registryObject = await this.suiClient.getObject({
        id: CONTRACT_CONFIG.REGISTRY_ID,
        options: {
          showContent: true,
        },
      });

      if (registryObject.data?.content && 'fields' in registryObject.data.content) {
        const fields = registryObject.data.content.fields as any;
        return {
          totalCount: parseInt(fields.total_count),
          categoriesCount: Object.keys(fields.categories?.fields || {}).length,
        };
      }
    } catch (error) {
      console.error('Error fetching registry stats:', error);
    }

    return { totalCount: 0, categoriesCount: 0 };
  }

  // Get explanations by category
  async getExplanationsByCategory(category: string): Promise<string[]> {
    try {
      // This would require calling the view function on-chain
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error fetching explanations by category:', error);
      return [];
    }
  }
}