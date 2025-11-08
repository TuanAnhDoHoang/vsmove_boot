import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Wallet, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';

export function WalletConnection() {
  const account = useCurrentAccount();
  const { userProfile, theme, setTheme } = useAppStore();

  if (!account) {
    return (
      <ConnectButton
        connectText="Connect Wallet"
        connectedText="Connected"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      />
    );
  }

  const shortAddress = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;

  return (
    <div className="flex items-center gap-4">
      {/* Network Badge */}
      <Badge variant="outline" className="hidden sm:flex">
        Sui Testnet
      </Badge>

      {/* Simple User Info */}
      <div className="flex items-center gap-2 text-sm">
        <Wallet className="h-4 w-4" />
        <span>{shortAddress}</span>
        {userProfile && (
          <Badge variant="secondary">
            {userProfile.username}
          </Badge>
        )}
      </div>
    </div>
  );
}