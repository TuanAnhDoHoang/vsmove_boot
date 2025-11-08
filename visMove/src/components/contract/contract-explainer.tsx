"use client";

// React & Hooks
import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useNetwork } from '@/hooks/NetworkContext';
import { useToast } from '@/hooks/use-toast';

// Third-party Libraries
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Sui SDK
import { getFullnodeUrl, SuiClient, type SuiMoveNormalizedModules } from '@mysten/sui/client';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { Code, Lightbulb, List, Loader2, ServerCrash, Terminal, Upload } from 'lucide-react';

// Local Components & Types
import UMLDisplay from './uml-display';
import type { ExplainContractFunctionOutput } from '@/ai/flows/explain-contract-function';

// Actions & Utilities
import { getFunctionExplanation } from '@/lib/actions';
import { getModuleMove, getPackageMove } from './getMoveCode';

// Smart Contract Integration
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

// Smart Contract Constants
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0';
const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID || '0x0';

const FormSchema = z.object({
  packageId: z.string({ message: 'Please enter a valid package id' }),
});

type FormValues = z.infer<typeof FormSchema>;

export default function ContractExplainer() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // Wallet integration
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // UI & Selection States
  const [isContractVisible, setIsContractVisible] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [viewCoinFlow, setViewCoinFlow] = useState<boolean>(false);

  // Contract Data States
  const [modules, setModules] = useState<string[]>([]);
  const [functions, setFunctions] = useState<string[]>([]);
  const [moduleCode, setModuleCode] = useState<string>("");
  const [packageCode, setPackageCode] = useState(new Map());

  // Result & Package
  const [explanationResult, setExplanationResult] = useState<ExplainContractFunctionOutput | null>(null);
  const [packageid, setPackageid] = useState<string>();

  // Network & Error
  const { currNetwork } = useNetwork();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      packageId: '',
    },
  });

  const getContractCode = async (packageid: string) => {
    try {
      // Use Sui client directly instead of localhost API
      const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
      const packageObject = await suiClient.getObject({
        id: packageid,
        options: {
          showContent: true,
        },
      });
      
      // Mock data for demonstration
      const mockPackageCode = new Map();
      mockPackageCode.set('example_module', `
        module ${packageid}::example_module {
          public fun example_function() {
            // Example function implementation
          }
          
          public fun another_function(param: u64): u64 {
            param + 1
          }
        }
      `);
      
      setPackageCode(mockPackageCode);
      setModules(Array.from(mockPackageCode.keys()));
    } catch (error) {
      console.error('Error fetching contract:', error);
      setError('Failed to fetch contract. Please check the package ID.');
    }
  }

  const handleExplainSubmit: SubmitHandler<FormValues> = async (props) => {
    await getContractCode(props.packageId);
    setIsContractVisible(true);
    setExplanationResult(null);
    setSelectedFunction(null);
    setError(null);
  };

  const getFunctionsByModuleName = (moduleName: string) => {
    const functionRegex = /public?\s+fun\s+([\w_]+)\s*/g;
    let code = packageCode.get(moduleName);
    const extractedFunctions = [...code.matchAll(functionRegex)].map(match => match[1]);
    setFunctions(extractedFunctions);
  }

  const handleFunctionSelect = (functionName: string) => {
    setSelectedFunction(functionName);
    setExplanationResult(null);
    setError(null);

    startTransition(async () => {
      const result = await getFunctionExplanation({ contractCode: moduleCode, functionName });
      if (result.error) {
        setError(result.error);
        toast({
          variant: 'destructive',
          title: 'Explanation Failed',
          description: result.error,
        });
      } else {
        setExplanationResult(result.data);
      }
    });
  };

  const saveExplanationOnChain = async () => {
    if (!account?.address || !explanationResult || !selectedFunction || !selectedModule || !packageid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please connect wallet and generate explanation first'
      });
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::vmc::create_explanation`,
      arguments: [
        tx.object('ADMIN_CAP_ID'),
        tx.object(REGISTRY_ID),
        tx.pure.string(`${selectedModule}::${selectedFunction}`),
        tx.pure.address(packageid),
        tx.pure.string(selectedModule),
        tx.pure.string(selectedFunction),
        tx.pure.string(explanationResult.explanation)
      ]
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Explanation saved on-chain!'
          });
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to save explanation'
          });
        }
      }
    );
  };

  const rateExplanation = async (rating: number) => {
    if (!account?.address) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please connect wallet first'
      });
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::vmc::rate_explanation`,
      arguments: [
        tx.object('EXPLANATION_OBJECT_ID'),
        tx.pure.u64(rating)
      ]
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Rating submitted!'
          });
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to submit rating'
          });
        }
      }
    );
  };
  
  const handleModuleSelect = (moduleName: string) => {
    setSelectedModule(moduleName)
    setModuleCode(getModuleMove(packageCode, moduleName) || "");
    getFunctionsByModuleName(moduleName);
  }
  
  const handleChangeView = (mode: string) => {
    if(mode === "Function" && viewCoinFlow === true){
      setViewCoinFlow(false);
    }
    if(mode === "Coin flow" && viewCoinFlow === false){
      setViewCoinFlow(true);
    }
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Explain a Smart Contract</CardTitle>
          <CardDescription>
            Paste package id to input, I will explain it for you :3<br />
            Example: <br />
            Centus CLMM: 0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => handleExplainSubmit({ packageId: packageid ?? '' }))} className="flex flex-col sm:flex-row items-start gap-4">
              <FormField
                control={form.control}
                name="packageId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">Contract URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb"
                        {...field}
                        onChange={e => {
                          field.onChange(e);
                          setPackageid(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
                {isPending && functions.length === 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Parse Contract
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {account && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Connected: {account.address.slice(0, 8)}...{account.address.slice(-6)}
            </div>
          </CardContent>
        </Card>
      )}

      {isContractVisible && (
        <div className='flex flex-col gap-10'>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 border border-1px border-gray-600 rounded-md p-4">
            <div className="md:col-span-1 space-y-4 flex flex-col">
              <h3 className="font-headline text-xl font-semibold flex items-center gap-2">
                <List className="h-5 w-5 text-primary" />
                Contract Modules
              </h3>
              <div className="flex flex-col gap-2">
                {modules.map(mod => (
                  <Button
                    key={mod}
                    variant={selectedModule === mod ? 'default' : 'secondary'}
                    onClick={() => handleModuleSelect(mod)}
                    className="justify-start"
                  >
                    {mod}
                  </Button>
                ))}
              </div>
            </div>
            {selectedModule && (
              <div className='flex flex-col gap-2 w-full'>
                <h3 className=" font-headline text-xl font-semibold flex items-center gap-2">
                  <List className="h-5 w-5 text-primary" />
                  Contract Functions
                </h3>
                <div className="grid grid-cols-2 gap-2 ">
                  {functions.map(func => (
                    <Button
                      key={func}
                      variant={selectedFunction === func ? 'default' : 'secondary'}
                      onClick={() => handleFunctionSelect(func)}
                      disabled={isPending}
                      className="justify-center px-3 py-1 bg-gray-700 rounded-md text-sm text-white truncate"
                    >
                      {isPending && selectedFunction === func && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {func}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="">
            {isPending && <ExplanationSkeleton />}

            {error && !isPending && (
              <Alert variant="destructive">
                <ServerCrash className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {explanationResult && !isPending && (
              <div className='flex flex-col gap-4'>
                <div className='flex justify-center'>
                  <div className='
                    flex rounded-full 
                    w-4/5 border border-white border-2px 
                    justify-between'>
                    {['Function', 'Coin flow'].map(c => (
                      <button
                        key={c}
                        onClick={() => handleChangeView(c)}
                        className='size-20 w-1/2 rounded-full hover:text-lg'
                      >{c}</button>
                    ))}
                  </div>
                </div>
                <Card>
                  <CardHeader className='relative'>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                      <Terminal className="h-6 w-6 text-primary" />
                      Function: {selectedFunction}
                    </CardTitle>
                    <div
                      onClick={saveExplanationOnChain}
                      className='hover:cursor-pointer
                    absolute top-2 right-2 h-6 w-6 
                    flex items-center justify-center rounded-full bg-primary text-primary-foreground rounded-full p-1'
                      title="Save to blockchain">
                      <Upload className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">{explanationResult.explanation}</p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-accent" />
                          Concepts to understand
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {explanationResult.conceptsToExplain.map((concept, i) => (
                            <Badge key={i} variant="outline">{concept}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      {account && (
                        <div className="space-y-2">
                          <h4 className="font-semibold">Rate this explanation:</h4>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <Button
                                key={rating}
                                variant="outline"
                                size="sm"
                                onClick={() => rateExplanation(rating)}
                              >
                                {rating} ⭐
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {viewCoinFlow? 
                <div>
                  {explanationResult.coinFlow}
                </div>
                :
                <div className='code-diagram'>
                  <UMLDisplay
                    umlString={explanationResult.umlSequenceDiagram}
                    functionName={selectedFunction || 'Diagram'}
                  />
                </div>
                }
              </div>
            )}
            {moduleCode && (
              <div className='whitespace-pre-wrap border border-1px border-gray-200 rounded-md p-4 overflow-scroll mt-10'>
                {moduleCode}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function ExplanationSkeleton() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="pt-4 space-y-2">
            <Skeleton className="h-5 w-1/4" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}