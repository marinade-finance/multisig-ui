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

const MultisigContext = React.createContext<MultisigContextValues>({
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
    const opts: ConfirmOptions = {
      preflightCommitment: "recent",
      commitment: "recent",
    };
    const connection = new Connection(network.url, opts.preflightCommitment);
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