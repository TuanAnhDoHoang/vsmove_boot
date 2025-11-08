'use client'
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';

import '@mysten/dapp-kit/dist/index.css';
import { SuiClientContext, SuiClientProvider, useSuiClientContext, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki';
import { useEffect } from 'react';
import { createContext } from 'vm';
import { NetworkProvider } from '@/hooks/NetworkContext';

export const network = 'mainnet';
const suiClient = new SuiClient({ url: getFullnodeUrl(network) });
const queryClient = new QueryClient();
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!isEnokiNetwork(network)) return;

    const { unregister } = registerEnokiWallets({
      client: suiClient,
      network: 'testnet',
      apiKey: 'enoki_public_9c1005a5ed80966ce3da247342682ab4',
      providers: {
        google: {
          clientId: '213423526149-8bdg3em3vj2lj68itsvdcl1q0rltqgr6.apps.googleusercontent.com',
        },
        facebook: {
          clientId: 'YOUR_FACEBOOK_CLIENT_ID',
        },
        twitch: {
          clientId: 'YOUR_TWITCH_CLIENT_ID',
        },
      },
    });
    return unregister;
  }, [client, network]);

  return null;
}

const metadata: Metadata = {
  title: 'VsMove',
  description: 'Smart contract for Kid',
};
const networkContext = createContext();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>VsMove</title>
        <link rel="stylesheet" href="vsmove_logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <QueryClientProvider client={queryClient}>
          <SuiClientProvider networks={networks} defaultNetwork={'testnet'}>
            <RegisterEnokiWallets />
            <WalletProvider>
              <div className="relative flex min-h-dvh flex-col">
                <NetworkProvider>
                  <Header />
                  <div className="flex-1">{children}</div>
                </NetworkProvider>
              </div>
              <Toaster />
            </WalletProvider>
          </SuiClientProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
