import { WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { useMemo } from "react";

export default function WalletConnectionProvider(
  props: PropsWithChildren<ReactNode>
): ReactElement {

  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <WalletProvider wallets={wallets}>
      <WalletModalProvider>{props.children}</WalletModalProvider>
    </WalletProvider>
  );
};
