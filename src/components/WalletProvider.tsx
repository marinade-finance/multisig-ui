import { WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { useMemo } from "react";

export default function WalletConnectionProvider(
  props: PropsWithChildren<ReactNode>
): ReactElement {
  // 0.15 dropped the getXWallet() factories; instantiate adapters directly.
  const wallets = useMemo(
    () => [new SolflareWalletAdapter(), new PhantomWalletAdapter()],
    []
  );

  return (
    // wallet-adapter-react ships its own newer @types/react, whose ReactNode differs
    // from the app's @types/react@17; cast children to bridge the two type worlds.
    <WalletProvider wallets={wallets} autoConnect>
      {props.children as any}
    </WalletProvider>
  );
}
