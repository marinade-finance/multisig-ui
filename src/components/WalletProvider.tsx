import { WalletProvider } from "@solana/wallet-adapter-react";
import { getPhantomWallet, getSolflareWallet } from "@solana/wallet-adapter-wallets";
import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { useMemo } from "react";

export default function WalletConnectionProvider(
  props: PropsWithChildren<ReactNode>
): ReactElement {

  const wallets = useMemo(
    () => [
      getSolflareWallet(),
      getPhantomWallet(),
    ],
    []
  );

  return (
    <WalletProvider wallets={wallets}>
      {props.children}
    </WalletProvider>
  );
};
