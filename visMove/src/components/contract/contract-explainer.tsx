"use client";

/*
import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Code, Lightbulb, List, Loader2, ServerCrash, Terminal, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { mockContractCode, mockFunction } from '@/lib/mock-data';
import { getFunctionExplanation } from '@/lib/actions';
import type { ExplainContractFunctionOutput } from '@/ai/flows/explain-contract-function';
import UMLDisplay from './uml-display';
import { getFullnodeUrl, SuiClient, type SuiMoveNormalizedModules } from '@mysten/sui/client';
import { useNetwork } from '@/hooks/NetworkContext';
import { getModuleMove, getPackageMove } from './getMoveCode';

const [isContractVisible, setIsContractVisible] = useState(false);
const [functions, setFunctions] = useState<string[]>([]);
const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
const [selectedModule, setSelectedModule] = useState<string | null>(null);
const [explanationResult, setExplanationResult] = useState<ExplainContractFunctionOutput | null>(null);
const [packageid, setPackageid] = useState<string>();
const { currNetwork } = useNetwork();
const [modules, setModules] = useState<string[]>([]);
const [packageCode, setPackageCode] = useState(new Map());
const [error, setError] = useState<string | null>(null);
const [moduleCode, setModuleCode] = useState<string>("");
*/

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

// Mock Data
// import { mockContractCode, mockFunction } from '@/lib/mock-data';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const FormSchema = z.object({
  packageId: z.string({ message: 'Please enter a valid package id' }),
});

type FormValues = z.infer<typeof FormSchema>;


export default function ContractExplainer() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

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
  const currAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();



  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      packageId: '',
    },
  });


  const getContractCode = async (packageid: string) => {
    let packageCode = await getPackageMove(packageid, currNetwork);
    setPackageCode(packageCode);
    setModules(Array.from(packageCode.keys()));
  }
  const payment = async (): Promise<boolean> => {
    if (currAccount) {
      const tx = new Transaction();
      const amount = 1_000;
      const vsmove = "0xf2b8341fc93d683292ba428dccf83ba443c15ee19b9f0719bdd0a7f75218c926";
      const coin = tx.splitCoins(tx.gas, [amount]);
      tx.transferObjects([coin], vsmove);
      await signAndExecute({
        transaction: tx,
        account: currAccount
      }, {
        onSuccess(res) { return true; },
        onError(e) { alert!(`Got error executing transaction: ${e}`); return false; }
      })
      return true;
    }
    else {
      alert("Sign In Wallet");
    }
    return false;
  }

  const handleExplainSubmit: SubmitHandler<FormValues> = async (props) => {
    //check is it exist or do payment
    // if(findPackage()){

    // }

    const pay_result = await payment();
    if (!pay_result) {
      alert("Check Sign In or Error Payment Executing");
      return;
    }
    // console.log("success payment");
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
  const handleModuleSelect = (moduleName: string) => {
    setSelectedModule(moduleName)
    setModuleCode(getModuleMove(packageCode, moduleName) || "");
    getFunctionsByModuleName(moduleName);
  }
  const handleChangeView = (mode: string) => {
    if (mode === "Function" && viewCoinFlow === true) {
      setViewCoinFlow(false);
    }
    if (mode === "Coin flow" && viewCoinFlow === false) {
      setViewCoinFlow(true);
    }
  }
  const create_expl = async () => {
    const pid = "0xf8bfd9c5714ab5701d912a402819205b603b605c236cfc0cb642d982d8aac7d2";
    if (currAccount) {
      const response = await client.getOwnedObjects({
        owner: currAccount.address,
        options:{
          showContent: true
        }
      });
      const registry = response.data;
      console.log(registry);
      if (packageid && selectedModule && selectedFunction && explanationResult?.explanation) {
        const tx = new Transaction();
        tx.setGasBudget(1_000_000_000);
        const expl = tx.moveCall({
          target: `${pid}::vmc::create_explanation`,
          arguments: [
            tx.pure.string("unknow"),
            tx.pure.address(packageid),
            tx.pure.string(selectedModule),
            tx.pure.string(selectedFunction),
            tx.pure.string(explanationResult?.explanation),
            tx.pure.option("string", "unknow")
          ]
        });
        signAndExecute({
          transaction: tx,
          account: currAccount,
        }, {
          onSuccess(r) { },
          onError(e) { alert(e) }
        })
      }
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
                      // onClick={}
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
                      // onClick={}
                      className='hover:cursor-pointer
                    absolute top-2 right-2 h-6 w-6 
                    flex items-center justify-center rounded-full'
                      onClick={create_expl}
                    >
                      <Upload className="" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">{explanationResult.explanation}</p>

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
                  </CardContent>
                </Card>

                {viewCoinFlow ?
                  <div
                    className='border border-1px border-white rounded-md p-5'
                  >
                    {explanationResult.coinFlow}
                  </div>
                  :
                  <div className='code-diagram'>
                    <UMLDisplay
                      umlString={explanationResult.umlSequenceDiagram}
                      functionName={selectedFunction || 'Diagram'}
                    />
                    {/* <div className='whitespace-pre-wrap border border-1px border-gray-200 rounded-md p-4 overflow-scroll'>
                    {moduleCode}
                  </div> */}
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
