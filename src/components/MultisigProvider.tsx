import React, {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useContext,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { Connection, ConfirmOptions } from "@solana/web3.js";
import { Provider } from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { State as StoreState } from "../store/reducer";
import MultisigIdl from "../idl";
import { useWallet } from "@solana/wallet-adapter-react";

export const MultisigContext = React.createContext<MultisigContextValues>({
  multisigClient: null
});

type MultisigContextValues = {
  multisigClient: Program | null;
};

export default function MultisigProvider(
  props: PropsWithChildren<ReactNode>
): ReactElement {
  const { network } = useSelector((state: StoreState) => {
    return {
      network: state.common.network,
    };
  });
  const wallet = useWallet();

  const { multisigClient } = useMemo(() => {
    // web3.js forwards this Connection's commitment as sendTransaction's preflightCommitment,
    // and current agave rejects the deprecated "recent" variant with -32602 "Invalid params:
    // unknown variant `recent`". Use a current commitment level.
    const opts: ConfirmOptions = {
      preflightCommitment: "confirmed",
      commitment: "confirmed",
    };
    const connection = new Connection(network.url, opts.preflightCommitment);
    // marinade.rpcpool.com doesn't serve getMinimumBalanceForRentExemption, and web3.js
    // silently returns 0 on its error — which creates non-rent-exempt proposal accounts
    // that the program rejects (ConstraintRentExempt). Compute it from the fixed mainnet
    // rent params instead: (ACCOUNT_STORAGE_OVERHEAD + dataLen) * lamportsPerByteYear * 2.
    (connection as any).getMinimumBalanceForRentExemption = async (dataLen: number) =>
      (128 + dataLen) * 2 * 3480;
    // The send sites pass minContextSlot from getLatestBlockhashAndContext; strip it so a
    // lagging node in the pooled RPC can't reject the request. (The earlier "Invalid params"
    // was the deprecated "recent" commitment above, not minContextSlot.)
    const sendRawTransaction = connection.sendRawTransaction.bind(connection);
    (connection as any).sendRawTransaction = (rawTransaction: any, sendOpts: any = {}) => {
      const stripped = { ...(sendOpts || {}) };
      delete stripped.minContextSlot;
      return sendRawTransaction(rawTransaction, stripped);
    };
    const provider = new Provider(connection, wallet as any, opts);

    const multisigClient = new Program(
      MultisigIdl,
      network.multisigProgramId,
      provider
    );

    return {
      multisigClient,
    };
  }, [wallet, network]);

  return (
    <MultisigContext.Provider value={{ multisigClient }}>
      {props.children}
    </MultisigContext.Provider>
  );
}

export function useMultisig(): MultisigContextValues {
  return useContext(MultisigContext);
}