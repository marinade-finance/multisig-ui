import { PublicKey } from "@solana/web3.js";

export type Action = {
  type: ActionType;
  item: any;
};

export enum ActionType {
  CommonTriggerShutdown,
  CommonDidShutdown,
  CommonWalletDidConnect,
  CommonWalletDidDisconnect,
  CommonWalletSetProvider,
  CommonSetNetwork,
}

export default function reducer(
  state: State = initialState,
  action: Action
): State {
  let newState = {
    common: { ...state.common },
  };
  switch (action.type) {
    case ActionType.CommonWalletSetProvider:
      newState.common.walletProvider = action.item.walletProvider;
      return newState;
    case ActionType.CommonWalletDidConnect:
      newState.common.isWalletConnected = true;
      return newState;
    case ActionType.CommonWalletDidDisconnect:
      newState.common.isWalletConnected = false;
      return newState;
    case ActionType.CommonSetNetwork:
      if (newState.common.network.label !== action.item.network.label) {
        newState.common.network = action.item.network;
      }
      return newState;
    default:
      return newState;
  }
}

export type State = {
  common: CommonState;
};

export type CommonState = {
  walletProvider?: string;
  isWalletConnected: boolean;
  network: Network;
};

export const networks: Networks = {
  mainnet: {
    // Cluster.
    label: "Mainnet Beta",
    url: "https://solana-api.projectserum.com",
    explorerClusterSuffix: "",
    multisigProgramId: new PublicKey(
      "A6ZR2g7UiGobEr2YkRxd1HSbc5PoKMnyDGAKh2JkWgMg"
    ),
    multisigUpgradeAuthority: new PublicKey(
      "3Pb4Q6XcZCCgz7Gvd229YzFoU1DpQ4myUQFx8Z9AauQ6"
    ),
    defaultMultisig: new PublicKey(
      "1YCaMif84S2RSc83eiuGijeRiKXisGT62Mui7LbDHhN"
    ),
  },
  testnet: {
    // Cluster.
    label: "Testnet",
    url: "https://api.testnet.solana.com",
    explorerClusterSuffix: "devnet",
    multisigProgramId: new PublicKey(
      "H88LfRBiJLZ7wYkHGuwkKTaijfQxexq8JvzUndu7fyjL"
      //"A6ZR2g7UiGobEr2YkRxd1HSbc5PoKMnyDGAKh2JkWgMg"
    ),
    multisigUpgradeAuthority: new PublicKey(
      "3Pb4Q6XcZCCgz7Gvd229YzFoU1DpQ4myUQFx8Z9AauQ6"
    ),
    defaultMultisig: new PublicKey(
      "BodZA4qfN9ggbmCzCyRyruPnVHbFyALZcYqBy1SgNusK"
      //"1YCaMif84S2RSc83eiuGijeRiKXisGT62Mui7LbDHhN"
    ),
  },
  devnet: {
    // Cluster.
    label: "Devnet",
    url: "https://api.devnet.solana.com",
    explorerClusterSuffix: "devnet",
    multisigProgramId: new PublicKey(
      "A6ZR2g7UiGobEr2YkRxd1HSbc5PoKMnyDGAKh2JkWgMg"
    ),
  },
  // Fill in with your local cluster addresses.
  localhost: {
    // Cluster.
    label: "Localhost",
    url: "http://localhost:8899",
    explorerClusterSuffix: "localhost",
    multisigProgramId: new PublicKey(
      "A6ZR2g7UiGobEr2YkRxd1HSbc5PoKMnyDGAKh2JkWgMg"
    ),
  },
};

export const initialState: State = {
  common: {
    isWalletConnected: false,
    walletProvider: "https://www.sollet.io",
    network: networks.testnet,
  },
};

type Networks = { [label: string]: Network };

export type Network = {
  // Cluster.
  label: string;
  url: string;
  explorerClusterSuffix: string;
  multisigProgramId: PublicKey;
  defaultMultisig?: PublicKey;
  multisigUpgradeAuthority?: PublicKey;
};
