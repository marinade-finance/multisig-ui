import { useState, useEffect } from "react";
import { useHistory } from "react-router";
import { useSnackbar } from "notistack";
import { fromUint8Array as fromUint8ArrayToBase64 } from "js-base64";
import Container from "@material-ui/core/Container";
import AppBar from "@material-ui/core/AppBar";
import GavelIcon from "@material-ui/icons/Gavel";
import DescriptionIcon from "@material-ui/icons/Description";
import Paper from "@material-ui/core/Paper";
import SupervisorAccountIcon from "@material-ui/icons/SupervisorAccount";
import CheckIcon from "@material-ui/icons/Check";
import ReceiptIcon from "@material-ui/icons/Receipt";
import RemoveIcon from "@material-ui/icons/Remove";
import Collapse from "@material-ui/core/Collapse";
import Toolbar from "@material-ui/core/Toolbar";
import InfoIcon from "@material-ui/icons/Info";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import BuildIcon from "@material-ui/icons/Build";
import Tooltip from "@material-ui/core/Tooltip";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import CardContent from "@material-ui/core/CardContent";
import TextField from "@material-ui/core/TextField";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import AddIcon from "@material-ui/icons/Add";
import ShowIcon from "@material-ui/icons/RemoveRedEye";
import List from "@material-ui/core/List";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import BN from "bn.js";
import {
  Account,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { ViewTransactionOnExplorerButton } from "./Notification";
import * as idl from "../utils/idl";
import { networks } from "../store/reducer";
import { useMultisig } from "./MultisigProvider";
import { AccountBalanceWallet } from "@material-ui/icons";
import { mndeTransferInstruction } from "../commands/mnde_transfer";
import { store } from "../store";
import { useWallet } from "@solana/wallet-adapter-react";

// Seed for generating the idlAddress.
function seed(): string {
  return "anchor:idl";
}

// Deterministic IDL address as a function of the program id.
async function idlAddress(programId: PublicKey): Promise<PublicKey> {
  const base = (await PublicKey.findProgramAddress([], programId))[0];
  return await PublicKey.createWithSeed(base, seed(), programId);
}

export default function Multisig({ multisig }: { multisig?: PublicKey }) {
  return (
    <div>
      <Container fixed maxWidth="md">
        <div
          style={{
            position: "fixed",
            bottom: "75px",
            right: "75px",
            display: "flex",
            flexDirection: "row-reverse",
          }}
        >
          <NewMultisigButton />
        </div>
      </Container>
      {multisig && <MultisigInstance multisig={multisig} />}
    </div>
  );
}

function NewMultisigButton() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "flex" }}>
      <IconButton
        style={{
          border: "solid 1pt #ccc",
          width: "60px",
          height: "60px",
          borderRadius: "30px",
        }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </IconButton>
      <NewMultisigDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export function MultisigInstance({ multisig }: { multisig: PublicKey }) {
  const { multisigClient } = useMultisig();
  const [multisigAccount, setMultisigAccount] = useState<any>(undefined);
  const [transactions, setTransactions] = useState<any>(null);
  const [showSignerDialog, setShowSignerDialog] = useState(false);
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const [showExecuted, setShowExecuted] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  useEffect(() => {
    multisigClient?.account.multisig
      .fetch(multisig)
      .then((account: any) => {
        setMultisigAccount(account);
      })
      .catch((err: any) => {
        console.error(err);
        setMultisigAccount(null);
      });
  }, [multisig, multisigClient?.account]);
  useEffect(() => {
    multisigClient?.account.transaction.all(multisig.toBuffer()).then((txs) => {
      setTransactions(txs);
    });
  }, [multisigClient?.account.transaction, multisig, forceRefresh]);
  useEffect(() => {
    multisigClient?.account.multisig
      .subscribe(multisig)
      .on("change", (account) => {
        setMultisigAccount(account);
      });
  }, [multisigClient, multisig]);
  return (
    <Container fixed maxWidth="md" style={{ marginBottom: "16px" }}>
      <div>
        <Card style={{ marginTop: "24px" }}>
          {multisigAccount === undefined ? (
            <div style={{ padding: "16px" }}>
              <CircularProgress
                style={{
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              />
            </div>
          ) : multisigAccount === null ? (
            <CardContent>
              <Typography
                color="textSecondary"
                style={{
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                Multisig not found
              </Typography>
            </CardContent>
          ) : (
            <></>
          )}
        </Card>
        {multisigAccount && (
          <Paper>
            <AppBar
              style={{ marginTop: "24px" }}
              position="static"
              color="default"
              elevation={1}
            >
              <Toolbar>
                <Typography variant="h6" style={{ flexGrow: 1 }} component="h2">
                  {multisig.toString()} | {multisigAccount.threshold.toString()}{" "}
                  of {multisigAccount.owners.length.toString()} Multisig
                </Typography>
                <Tooltip title="Signer" arrow>
                  <IconButton onClick={() => setShowSignerDialog(true)}>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add" arrow>
                  <IconButton onClick={() => setShowAddTransactionDialog(true)}>
                    <AddIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Show/Hide Executed" arrow>
                  <IconButton onClick={() => setShowExecuted(!showExecuted)}>
                    <ShowIcon />
                  </IconButton>
                </Tooltip>
              </Toolbar>

            </AppBar>
            <List disablePadding>
              {renderItems(showExecuted, multisig, multisigAccount, transactions)
                // transactions.map((tx: any) => (
                //   <TxListItem
                //     key={tx.publicKey.toString()}
                //     multisig={multisig}
                //     multisigAccount={multisigAccount}
                //     tx={tx}
                //   />
                // ))
              }
            </List>
          </Paper>
        )}
      </div>
      <AddTransactionDialog
        multisig={multisig}
        open={showAddTransactionDialog}
        onClose={() => setShowAddTransactionDialog(false)}
        didAddTransaction={() => setForceRefresh(!forceRefresh)}
      />
      {multisigAccount && (
        <SignerDialog
          multisig={multisig}
          multisigAccount={multisigAccount}
          open={showSignerDialog}
          onClose={() => setShowSignerDialog(false)}
        />
      )}
    </Container>
  );
}

type MultisigTransaction = {
  publicKey: PublicKey
  account: {
    didExecute: boolean
  }
}

function renderItems(showExecuted: boolean, multisig: any, multisigAccount: any, transactions: MultisigTransaction[]) {
  if (transactions === null) {
    return <div style={{ padding: "16px" }}>
      <CircularProgress
        style={{
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />
    </div>
  }
  if (transactions.length === 0) {
    return <ListItem>
      <ListItemText primary="No transactions found" />
    </ListItem>
  }
  let result = []
  for (let tx of transactions) {
    // hardcoded - ignore/hide marinade deprecated txs
    // TODO - add "deprecated" condition to a tx (BE)
    const key = tx.publicKey.toBase58()
    if (key !== "AsaE7fbkmBTbq3MGKNZ15w1eUY9nikzafn7TvNn9ZvQf"
      && key !== "2qito92LRcGsE4wgmxTUdeBhYoDicjEi8CAM3rPbi8cQ"
      && key !== "7F5aEkm5PHDWAEe7WgT12q8Anijkx6gXQq8hATdhV7Rr"
    )
      if (showExecuted || !tx.account.didExecute) {
        result.push(
          <TxListItem
            key={tx.publicKey.toString()}
            multisig={multisig}
            multisigAccount={multisigAccount}
            tx={tx}
          />)
      }
  }
  return result
}

export function NewMultisigDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const history = useHistory();
  const { multisigClient } = useMultisig();
  const { enqueueSnackbar } = useSnackbar();
  const [threshold, setThreshold] = useState(2);
  // @ts-ignore
  const zeroAddr = PublicKey.default.toString();
  const [participants, setParticipants] = useState([zeroAddr]);
  const _onClose = () => {
    onClose();
    setThreshold(2);
    setParticipants([zeroAddr, zeroAddr]);
  };
  const [maxParticipantLength, setMaxParticipantLength] = useState(10);
  const disableCreate = maxParticipantLength < participants.length;
  const createMultisig = async () => {
    if (!multisigClient?.provider.wallet.publicKey)
      throw Error("Wallet not connected");
    enqueueSnackbar("Creating multisig", {
      variant: "info",
    });
    const multisig = new Account();
    // Disc. + threshold + nonce.
    const baseSize = 8 + 8 + 1 + 4;
    // Add enough for 2 more participants, in case the user changes one's
    /// mind later.
    const fudge = 64;
    // Can only grow the participant set by 2x the initialized value.
    const ownerSize = maxParticipantLength * 32 + 8;
    const multisigSize = baseSize + ownerSize + fudge;
    const [, nonce] = await PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      multisigClient.programId
    );
    const owners = participants.map((p) => new PublicKey(p));
    const tx = await multisigClient.rpc.createMultisig(
      owners,
      new BN(threshold),
      nonce,
      {
        accounts: {
          multisig: multisig.publicKey,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [multisig],
        instructions: [
          await multisigClient.account.multisig.createInstruction(
            multisig,
            // @ts-ignore
            multisigSize
          ),
        ],
      }
    );
    enqueueSnackbar(`Multisig created: ${multisig.publicKey.toString()}`, {
      variant: "success",
      action: <ViewTransactionOnExplorerButton signature={tx} />,
    });
    _onClose();
    history.push(`/${multisig.publicKey.toString()}`);
  };
  return (
    <Dialog fullWidth open={open} onClose={_onClose} maxWidth="md">
      <DialogTitle>
        <Typography variant="h4" component="h2">
          New Multisig
        </Typography>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Threshold"
          value={threshold}
          type="number"
          onChange={(e) => setThreshold(parseInt(e.target.value) as number)}
        />
        <TextField
          fullWidth
          label="Max Number of Participants (cannot grow the owner set past this)"
          value={maxParticipantLength}
          type="number"
          onChange={(e) =>
            setMaxParticipantLength(parseInt(e.target.value) as number)
          }
        />
        {participants.map((p, idx) => (
          <TextField
            key={p}
            fullWidth
            label="Participant"
            value={p}
            onChange={(e) => {
              const p = [...participants];
              p[idx] = e.target.value;
              setParticipants(p);
            }}
          />
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <IconButton
            onClick={() => {
              const p = [...participants];
              // @ts-ignore
              p.push(new PublicKey("11111111111111111111111111111111").toString());
              setParticipants(p);
            }}
          >
            <AddIcon />
          </IconButton>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={_onClose}>Cancel</Button>
        <Button
          disabled={disableCreate}
          variant="contained"
          type="submit"
          color="primary"
          onClick={() =>
            createMultisig().catch((err) => {
              const str = err ? err.toString() : "";
              enqueueSnackbar(`Error creating multisig: ${str}`, {
                variant: "error",
              });
            })
          }
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
* Formats a BN with commas and 5,2, or 0 decimal places
* @param {number} bn 
*/
export function toStringDecMin(bn: BN, decimals: number): string {
  return addCommas(removeDecZeroes(withDecimalPoint(bn, decimals)));
}
function withDecimalPoint(bn: BN, decimals: number): string {
  const s = bn.toString().padStart(decimals + 1, '0')
  const l = s.length
  return s.slice(0, l - decimals) + '.' + s.slice(-decimals)
}

/**
* removes extra zeroes after the decimal point
* it leaves >4,2, or none (never 3 to not confuse the international user)
* @param {string} withDecPoint
*/
export function removeDecZeroes(withDecPoint: string): string {
  let decPointPos = withDecPoint.indexOf('.')
  if (decPointPos <= 0) return withDecPoint;
  let decimals = withDecPoint.length - decPointPos - 1;
  while (withDecPoint.endsWith("0") && decimals-- > 4) withDecPoint = withDecPoint.slice(0, -1);
  if (withDecPoint.endsWith("00")) withDecPoint = withDecPoint.slice(0, -2)
  if (withDecPoint.endsWith(".00")) withDecPoint = withDecPoint.slice(0, -3)
  return withDecPoint;
}
/**
 * adds commas to a string number 
 * @param {string} str 
 */
export function addCommas(str: string) {
  let n = str.indexOf(".")
  if (n === -1) n = str.length
  n -= 4
  while (n >= 0) {
    str = str.slice(0, n + 1) + "," + str.slice(n + 1)
    n = n - 3
  }
  return str;
}


function TxListItem({
  multisig,
  multisigAccount,
  tx,
}: {
  multisig: PublicKey;
  multisigAccount: any;
  tx: any;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const { multisigClient } = useMultisig();
  const { sendTransaction } = useWallet();
  const [open, setOpen] = useState(false);
  const [txAccount, setTxAccount] = useState(tx.account);
  useEffect(() => {
    multisigClient?.account.transaction
      .subscribe(tx.publicKey)
      .on("change", (account) => {
        setTxAccount(account);
      });
  }, [multisigClient, multisig, tx.publicKey]);

  let txData = fromUint8ArrayToBase64(txAccount.data)
  let translated = "";
  if (txAccount.programId.toString() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" &&
    txAccount.data[0] === 3 // 3=>SPL-Token-Transfer
  ) {
    let slice = txAccount.data.slice(1, 9);
    let amount = new BN(slice, 'le').fromTwos(64);
    // marinade patch - until we move to SPL-gov
    const from = txAccount.accounts[0].pubkey.toBase58()
    const MarinadeUSDCAta = "9vKwu77KUVgmAYrB96PPMHrZtnvJXs9aKzFxfa71gDTX"
    const decimals = from === MarinadeUSDCAta ? 6 : 9
    const units = from === MarinadeUSDCAta ? " USDC" : ""
    translated = "Transfer " + toStringDecMin(amount, decimals) + units + " from " + from + " to " + txAccount.accounts[1].pubkey.toBase58();
  }
  // TODO - include Marinade.IDL and decode instruction Data
  /*else if (txAccount.programId.toString() === "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD" &&
    txData.startsWith("QwMicr")) {
    translated = "Marinade"
    let slice = txAccount.data.slice(8, 8 + 3);
    let bn = new BN(slice, 'le').fromTwos(64);
    translated = bn.toString()
  }
  */

  const rows = [
    {
      field: "Decoded",
      value: translated,
    },
    {
      field: "Program ID",
      value: txAccount.programId.toString(),
    },
    {
      field: "Did execute",
      value: txAccount.didExecute.toString(),
    },
    {
      field: "Instruction data",
      value: (
        <code
          style={{
            wordBreak: "break-word",
            width: "370px",
            background: "black",
            color: "#ffffff",
            float: "right",
            textAlign: "left",
          }}
        >
          {txData}
        </code>
      ),
    },
    {
      field: "Multisig",
      value: txAccount.multisig.toString(),
    },
    {
      field: "Transaction account",
      value: tx.publicKey.toString(),
    },
    {
      field: "Owner set seqno",
      value: txAccount.ownerSetSeqno.toString(),
    },
  ];
  const msAccountRows = multisigAccount.owners.map(
    (owner: PublicKey, idx: number) => {
      return {
        field: owner.toString(),
        value: txAccount.signers[idx] ? <CheckIcon /> : <RemoveIcon />,
      };
    }
  );
  const approve = async () => {
    if (!multisigClient?.provider.wallet.publicKey)
      throw Error("Wallet not connected");
    enqueueSnackbar("Approving transaction", {
      variant: "info",
    });
    const ix = multisigClient.instruction.approve({
      accounts: {
        multisig,
        transaction: tx.publicKey,
        owner: multisigClient.provider.wallet.publicKey,
      },
    });
    const t = new Transaction();
    t.add(ix);
    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight },
    } = await multisigClient.provider.connection.getLatestBlockhashAndContext();

    const signature = await sendTransaction(
      t,
      multisigClient.provider.connection,
      { minContextSlot }
    );

    await multisigClient.provider.connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature,
    });
    enqueueSnackbar("Transaction approved", {
      variant: "success",
    });
  };
  const execute = async () => {
    enqueueSnackbar("Executing transaction", {
      variant: "info",
    });
    if (!multisigClient?.provider.wallet.publicKey)
      throw Error("Wallet not connected");
    const [multisigSigner] = await PublicKey.findProgramAddress(
      [multisig.toBuffer()],
      multisigClient.programId
    );
    const ix = multisigClient.instruction.executeTransaction({
      accounts: {
        multisig,
        multisigSigner,
        transaction: tx.publicKey,
      },
      remainingAccounts: txAccount.accounts
        .map((t: any) => {
          if (t.pubkey.equals(multisigSigner)) {
            return { ...t, isSigner: false };
          }
          return t;
        })
        .concat({
          pubkey: txAccount.programId,
          isWritable: false,
          isSigner: false,
        }),
    });
    const t = new Transaction();
    t.add(ix);
    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight },
    } = await multisigClient.provider.connection.getLatestBlockhashAndContext();

    const signature = await sendTransaction(
      t,
      multisigClient.provider.connection,
      { minContextSlot }
    );

    await multisigClient.provider.connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature,
    });
    enqueueSnackbar("Transaction executed", {
      variant: "success",
    });
  };
  return (
    <>
      <ListItem button onClick={() => setOpen(!open)}>
        <ListItemIcon>{icon(tx, multisigClient)}</ListItemIcon>
        {ixLabel(tx, multisigClient)}
        {txAccount.didExecute && (
          <CheckCircleIcon style={{ marginRight: "16px" }} />
        )}
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <div style={{ background: "#ececec", padding: "10px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              style={{ marginRight: "10px" }}
              variant="contained"
              color="primary"
              onClick={() =>
                approve().catch((err) => {
                  let errStr = "";
                  if (err) {
                    errStr = err.toString();
                  }
                  enqueueSnackbar(`Unable to approve transaction: ${errStr}`, {
                    variant: "error",
                  });
                })
              }
            >
              Approve
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() =>
                execute().catch((err) => {
                  let errStr = "";
                  if (err) {
                    errStr = err.toString() + '\n' + err.logs? err.logs.join('\n'):"" 
                  }
                  enqueueSnackbar(`Unable to execute transaction: ${errStr}`, {
                    variant: "error",
                  });
                })
              }
            >
              Execute
            </Button>
          </div>
          <Card style={{ marginTop: "16px" }}>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction Field</TableCell>
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow>
                      <TableCell>{r.field}</TableCell>
                      <TableCell align="right">{r.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card style={{ marginTop: "16px" }}>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Multisig Owner</TableCell>
                    <TableCell align="right">Did Sign</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {txAccount.ownerSetSeqno === multisigAccount.ownerSetSeqno &&
                    msAccountRows.map((r: any) => (
                      <TableRow>
                        <TableCell>{r.field}</TableCell>
                        <TableCell align="right">{r.value}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {txAccount.ownerSetSeqno !== multisigAccount.ownerSetSeqno && (
                <div style={{ marginTop: "16px" }}>
                  <Typography
                    color="textSecondary"
                    style={{ textAlign: "center" }}
                  >
                    The owner set has changed since this transaction was created
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>
          <Card style={{ marginTop: "16px" }}>
            <CardContent>
              <AccountsList accounts={txAccount.accounts} />
            </CardContent>
          </Card>
        </div>
      </Collapse>
    </>
  );
}

function ixLabel(tx: any, multisigClient: any) {
  if (tx.account.programId.equals(BPF_LOADER_UPGRADEABLE_PID)) {
    // Upgrade instruction.
    if (tx.account.data.equals(Buffer.from([3, 0, 0, 0]))) {
      return (
        <ListItemText
          primary="Program upgrade"
          secondary={tx.publicKey.toString()}
        />
      );
    }
  }
  if (tx.account.programId.equals(multisigClient.programId)) {
    const setThresholdSighash = multisigClient.coder.sighash(
      "global",
      "change_threshold"
    );
    if (setThresholdSighash.equals(tx.account.data.slice(0, 8))) {
      return (
        <ListItemText
          primary="Set threshold"
          secondary={tx.publicKey.toString()}
        />
      );
    }
    const setOwnersSighash = multisigClient.coder.sighash(
      "global",
      "set_owners"
    );
    if (setOwnersSighash.equals(tx.account.data.slice(0, 8))) {
      return (
        <ListItemText
          primary="Set owners"
          secondary={tx.publicKey.toString()}
        />
      );
    }
  }
  if (idl.IDL_TAG.equals(tx.account.data.slice(0, 8))) {
    return (
      <ListItemText primary="Upgrade IDL" secondary={tx.publicKey.toString()} />
    );
  }
  return <ListItemText primary={tx.publicKey.toString()} />;
}

function AccountsList({ accounts }: { accounts: any }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Account</TableCell>
          <TableCell align="right">Writable</TableCell>
          <TableCell align="right">Signer</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {accounts.map((r: any) => (
          <TableRow>
            <TableCell>{r.pubkey.toString()}</TableCell>
            <TableCell align="right">{r.isWritable.toString()}</TableCell>
            <TableCell align="right">{r.isSigner.toString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SignerDialog({
  multisig,
  multisigAccount,
  open,
  onClose,
}: {
  multisig: PublicKey;
  multisigAccount: any;
  open: boolean;
  onClose: () => void;
}) {
  const { multisigClient } = useMultisig();
  const [signer, setSigner] = useState<null | string>(null);

  useEffect(() => {
    if (multisigClient) {
      PublicKey.findProgramAddress(
        [multisig.toBuffer()],
        multisigClient.programId
      ).then((addrNonce) => setSigner(addrNonce[0].toString()));
    }
  }, [multisig, multisigClient, setSigner]);
  return (
    <Dialog open={open} fullWidth onClose={onClose} maxWidth="md">
      <DialogTitle>
        <Typography variant="h4" component="h2">
          Multisig Info
        </Typography>
      </DialogTitle>
      <DialogContent style={{ paddingBottom: "16px" }}>
        {multisig?.equals(networks.mainnet.multisigUpgradeAuthority!) && (
          <DialogContentText>
            This multisig is the upgrade authority for the multisig program
            itself.
          </DialogContentText>
        )}
        <DialogContentText>
          <b>Program derived address</b>: {signer}. This is the address one
          should use as the authority for data governed by the multisig.
        </DialogContentText>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Owners</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {multisigAccount.owners.map((r: any) => (
              <TableRow>
                <TableCell>{r.toString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function AddTransactionDialog({
  multisig,
  open,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  open: boolean;
  onClose: () => void;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  return (
    <Dialog open={open} fullWidth onClose={onClose} maxWidth="md">
      <DialogTitle>
        <Typography variant="h4" component="h2">
          New Transaction
        </Typography>
      </DialogTitle>
      <DialogContent style={{ paddingBottom: "16px" }}>
        <DialogContentText>
          Create a new transaction to be signed by the multisig. This
          transaction will not execute until enough owners have signed the
          transaction.
        </DialogContentText>
        <List disablePadding>
          <TransferMNDEListItem
            didAddTransaction={didAddTransaction}
            multisig={multisig}
            onClose={onClose}
          />
          <ProgramUpdateListItem
            didAddTransaction={didAddTransaction}
            multisig={multisig}
            onClose={onClose}
          />
          <IdlUpgradeListItem
            didAddTransaction={didAddTransaction}
            multisig={multisig}
            onClose={onClose}
          />
          <MultisigSetOwnersListItem
            didAddTransaction={didAddTransaction}
            multisig={multisig}
            onClose={onClose}
          />
          <ChangeThresholdListItem
            didAddTransaction={didAddTransaction}
            multisig={multisig}
            onClose={onClose}
          />
        </List>
      </DialogContent>
    </Dialog>
  );
}

function ChangeThresholdListItem({
  multisig,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  onClose: Function;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListItem button onClick={() => setOpen((open) => !open)}>
        <ListItemIcon>
          <GavelIcon />
        </ListItemIcon>
        <ListItemText primary={"Change threshold"} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <ChangeThresholdListItemDetails
          didAddTransaction={didAddTransaction}
          multisig={multisig}
          onClose={onClose}
        />
      </Collapse>
    </>
  );
}

function ChangeThresholdListItemDetails({
  multisig,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  onClose: Function;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  const [threshold, setThreshold] = useState(2);
  const { multisigClient } = useMultisig();
  // @ts-ignore
  const { enqueueSnackbar } = useSnackbar();
  const changeThreshold = async () => {
    if (!multisigClient?.provider.wallet.publicKey)
      throw Error("Wallet not connected");
    enqueueSnackbar("Creating change threshold transaction", {
      variant: "info",
    });
    const data = changeThresholdData(multisigClient, threshold);
    const [multisigSigner] = await PublicKey.findProgramAddress(
      [multisig.toBuffer()],
      multisigClient.programId
    );
    const accounts = [
      {
        pubkey: multisig,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: multisigSigner,
        isWritable: false,
        isSigner: true,
      },
    ];
    const transaction = new Account();
    const txSize = 1000; // todo
    const tx = await multisigClient.rpc.createTransaction(
      multisigClient.programId,
      accounts,
      data,
      {
        accounts: {
          multisig,
          transaction: transaction.publicKey,
          proposer: multisigClient.provider.wallet.publicKey,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [transaction],
        instructions: [
          await multisigClient.account.transaction.createInstruction(
            transaction,
            // @ts-ignore
            txSize
          ),
        ],
      }
    );
    enqueueSnackbar("Transaction created", {
      variant: "success",
      action: <ViewTransactionOnExplorerButton signature={tx} />,
    });
    didAddTransaction(transaction.publicKey);
    onClose();
  };
  return (
    <div
      style={{
        background: "#f1f0f0",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      <TextField
        fullWidth
        style={{ marginTop: "16px" }}
        label="Threshold"
        value={threshold}
        type="number"
        onChange={(e) => {
          // @ts-ignore
          setThreshold(e.target.value);
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={() => changeThreshold()}>Change Threshold</Button>
      </div>
    </div>
  );
}

function MultisigSetOwnersListItem({
  multisig,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  onClose: Function;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListItem button onClick={() => setOpen((open) => !open)}>
        <ListItemIcon>
          <SupervisorAccountIcon />
        </ListItemIcon>
        <ListItemText primary={"Set owners"} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <SetOwnersListItemDetails
          didAddTransaction={didAddTransaction}
          multisig={multisig}
          onClose={onClose}
        />
      </Collapse>
    </>
  );
}

function SetOwnersListItemDetails({
  multisig,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  onClose: Function;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  const { multisigClient } = useMultisig();
  // @ts-ignore
  const zeroAddr = PublicKey.default.toString();
  const [participants, setParticipants] = useState([zeroAddr]);
  const { enqueueSnackbar } = useSnackbar();
  const setOwners = async () => {
    if (!multisigClient?.provider.wallet.publicKey)
      throw Error("Wallet not connected");
    enqueueSnackbar("Creating setOwners transaction", {
      variant: "info",
    });
    const owners = participants.map((p) => new PublicKey(p));
    const data = setOwnersData(multisigClient, owners);
    const [multisigSigner] = await PublicKey.findProgramAddress(
      [multisig.toBuffer()],
      multisigClient.programId
    );
    const accounts = [
      {
        pubkey: multisig,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: multisigSigner,
        isWritable: false,
        isSigner: true,
      },
    ];
    const transaction = new Account();
    const txSize = 5000; // TODO: tighter bound.
    const tx = await multisigClient.rpc.createTransaction(
      multisigClient.programId,
      accounts,
      data,
      {
        accounts: {
          multisig,
          transaction: transaction.publicKey,
          proposer: multisigClient.provider.wallet.publicKey,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [transaction],
        instructions: [
          await multisigClient.account.transaction.createInstruction(
            transaction,
            // @ts-ignore
            txSize
          ),
        ],
      }
    );
    enqueueSnackbar("Transaction created", {
      variant: "success",
      action: <ViewTransactionOnExplorerButton signature={tx} />,
    });
    didAddTransaction(transaction.publicKey);
    onClose();
  };
  return (
    <div
      style={{
        background: "#f1f0f0",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      {participants.map((p, idx) => (
        <TextField
          fullWidth
          style={{ marginTop: "16px" }}
          label="Participant"
          value={p}
          onChange={(e) => {
            const p = [...participants];
            p[idx] = e.target.value;
            setParticipants(p);
          }}
        />
      ))}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <IconButton
          onClick={() => {
            const p = [...participants];
            // @ts-ignore
            p.push(new PublicKey("11111111111111111111111111111111").toString());
            setParticipants(p);
          }}
        >
          <AddIcon />
        </IconButton>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "16px",
          paddingBottom: "16px",
        }}
      >
        <Button onClick={() => setOwners()}>Set Owners</Button>
      </div>
    </div>
  );
}

function TransferMNDEListItem({
  multisig,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  onClose: Function;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListItem button onClick={() => setOpen((open) => !open)}>
        <ListItemIcon>
          <AccountBalanceWallet />
        </ListItemIcon>
        <ListItemText primary={"Transfer MNDE"} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <TransferMNDEListItemDetails
          didAddTransaction={didAddTransaction}
          multisig={multisig}
          onClose={onClose}
        />
      </Collapse>
    </>
  );
}

function TransferMNDEListItemDetails({
  multisig,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  onClose: Function;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  const [destinationAccount, setDestinationAccount] = useState<null | string>(null);
  const [amount, setAmount] = useState<null | number>(null);
  const { sendTransaction } = useWallet();

  const state = store.getState()

  const { multisigClient } = useMultisig();
  const { enqueueSnackbar } = useSnackbar();
  const transferMNDE = async () => {
    try {
      if (!multisigClient?.provider.wallet.publicKey) {
        throw Error("Wallet not connected");
      }

      enqueueSnackbar("Creating Transfer MNDE transaction", {
        variant: "info",
      });

      const [multisigSigner] = await PublicKey.findProgramAddress(
        [multisig.toBuffer()],
        multisigClient.programId
      );

      if (!destinationAccount) throw Error("destinationAccount is nothing")
      if (!amount || amount <= 0) throw Error("amount must be >=0")
      const splTransferInstruction = await mndeTransferInstruction(state.common.network.url, multisigClient, multisigSigner, destinationAccount, amount);
      const independentAccountToStoreMultisigInstruction = new Account();
      const txSize = 207; // pre-computed
      const ix = await multisigClient.instruction.createTransaction(
        splTransferInstruction.programId,
        splTransferInstruction.keys,
        splTransferInstruction.data,
        {
          accounts: {
            multisig,
            transaction: independentAccountToStoreMultisigInstruction.publicKey,
            proposer: multisigClient.provider.wallet.publicKey,
            rent: SYSVAR_RENT_PUBKEY,
          }
        }
      );

      const t = new Transaction();
      t.add(await multisigClient.account.transaction.createInstruction(
        independentAccountToStoreMultisigInstruction,
        // @ts-ignore
        txSize
      ));
      t.add(ix);
      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await multisigClient.provider.connection.getLatestBlockhashAndContext();

      const signature = await sendTransaction(
        t,
        multisigClient.provider.connection,
        {
          minContextSlot,
          signers: [independentAccountToStoreMultisigInstruction]
        }
      );

      await multisigClient.provider.connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      console.log(destinationAccount, amount);
      enqueueSnackbar("Transaction created", {
        variant: "success",
        action: <ViewTransactionOnExplorerButton signature={signature} />,
      });
      didAddTransaction(independentAccountToStoreMultisigInstruction.publicKey);
      onClose();
    } 
    catch (ex) {
      enqueueSnackbar("Error", {
        variant: "error",
        action: ex.message + "<br>" + ex.logs? ex.logs.join("<br>"):"",
      });
    }
  };

  return (
    <div
      style={{
        background: "#f1f0f0",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      <TextField
        fullWidth
        style={{ marginTop: "16px" }}
        label="Destination account"
        value={destinationAccount}
        onChange={(e) => setDestinationAccount(e.target.value as string)}
      />
      <TextField
        style={{ marginTop: "16px" }}
        fullWidth
        label="Amount to transfer"
        value={amount}
        type="number"
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "16px",
          paddingBottom: "16px",
        }}
      >
        <Button onClick={() => transferMNDE()}>
          Propose MNDE Transfer
        </Button>
      </div>
    </div>
  );
}

function IdlUpgradeListItem({
  multisig,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  onClose: Function;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListItem button onClick={() => setOpen((open) => !open)}>
        <ListItemIcon>
          <DescriptionIcon />
        </ListItemIcon>
        <ListItemText primary={"Upgrade IDL"} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <UpgradeIdlListItemDetails
          didAddTransaction={didAddTransaction}
          multisig={multisig}
          onClose={onClose}
        />
      </Collapse>
    </>
  );
}

function UpgradeIdlListItemDetails({
  multisig,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  onClose: Function;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  const [programId, setProgramId] = useState<null | string>(null);
  const [buffer, setBuffer] = useState<null | string>(null);

  const { multisigClient } = useMultisig();
  const { enqueueSnackbar } = useSnackbar();
  const createTransactionAccount = async () => {
    if (!multisigClient?.provider.wallet.publicKey)
      throw Error("Wallet not connected");
    enqueueSnackbar("Creating transaction", {
      variant: "info",
    });
    const programAddr = new PublicKey(programId as string);
    const bufferAddr = new PublicKey(buffer as string);
    const idlAddr = await idlAddress(programAddr);
    const [multisigSigner] = await PublicKey.findProgramAddress(
      [multisig.toBuffer()],
      multisigClient.programId
    );
    const data = idl.encodeInstruction({ setBuffer: {} });
    const accs = [
      {
        pubkey: bufferAddr,
        isWritable: true,
        isSigner: false,
      },
      { pubkey: idlAddr, isWritable: true, isSigner: false },
      { pubkey: multisigSigner, isWritable: true, isSigner: false },
    ];
    const txSize = 1000; // TODO: tighter bound.
    const transaction = new Account();
    const tx = await multisigClient.rpc.createTransaction(
      programAddr,
      accs,
      data,
      {
        accounts: {
          multisig,
          transaction: transaction.publicKey,
          proposer: multisigClient.provider.wallet.publicKey,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [transaction],
        instructions: [
          await multisigClient.account.transaction.createInstruction(
            transaction,
            // @ts-ignore
            txSize
          ),
        ],
      }
    );
    enqueueSnackbar("Transaction created", {
      variant: "success",
      action: <ViewTransactionOnExplorerButton signature={tx} />,
    });
    didAddTransaction(transaction.publicKey);
    onClose();
  };

  return (
    <div
      style={{
        background: "#f1f0f0",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      <TextField
        fullWidth
        style={{ marginTop: "16px" }}
        label="Program ID"
        value={programId}
        onChange={(e) => setProgramId(e.target.value as string)}
      />
      <TextField
        style={{ marginTop: "16px" }}
        fullWidth
        label="New IDL buffer"
        value={buffer}
        onChange={(e) => setBuffer(e.target.value as string)}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "16px",
          paddingBottom: "16px",
        }}
      >
        <Button onClick={() => createTransactionAccount()}>
          Create upgrade
        </Button>
      </div>
    </div>
  );
}

function ProgramUpdateListItem({
  multisig,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  onClose: Function;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListItem button onClick={() => setOpen((open) => !open)}>
        <ListItemIcon>
          <BuildIcon />
        </ListItemIcon>
        <ListItemText primary={"Upgrade program"} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <UpgradeProgramListItemDetails
          didAddTransaction={didAddTransaction}
          multisig={multisig}
          onClose={onClose}
        />
      </Collapse>
    </>
  );
}

const BPF_LOADER_UPGRADEABLE_PID = new PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);

function UpgradeProgramListItemDetails({
  multisig,
  onClose,
  didAddTransaction,
}: {
  multisig: PublicKey;
  onClose: Function;
  didAddTransaction: (tx: PublicKey) => void;
}) {
  const [programId, setProgramId] = useState<null | string>(null);
  const [buffer, setBuffer] = useState<null | string>(null);

  const { multisigClient } = useMultisig();
  const { enqueueSnackbar } = useSnackbar();
  const createTransactionAccount = async () => {
    if (!multisigClient?.provider.wallet.publicKey)
      throw Error("Wallet not connected");
    enqueueSnackbar("Creating transaction", {
      variant: "info",
    });
    const programAddr = new PublicKey(programId as string);
    const bufferAddr = new PublicKey(buffer as string);
    // Hard code serialization.
    const data = Buffer.from([3, 0, 0, 0]);

    const programAccount = await (async () => {
      const programAccount =
        await multisigClient.provider.connection.getAccountInfo(programAddr);
      if (programAccount === null) {
        throw new Error("Invalid program ID");
      }
      return {
        // Hard code deserialization.
        programdataAddress: new PublicKey(programAccount.data.slice(4)),
      };
    })();
    const spill = multisigClient.provider.wallet.publicKey;
    const [multisigSigner] = await PublicKey.findProgramAddress(
      [multisig.toBuffer()],
      multisigClient.programId
    );
    const accs = [
      {
        pubkey: programAccount.programdataAddress,
        isWritable: true,
        isSigner: false,
      },
      { pubkey: programAddr, isWritable: true, isSigner: false },
      { pubkey: bufferAddr, isWritable: true, isSigner: false },
      { pubkey: spill, isWritable: true, isSigner: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isWritable: false, isSigner: false },
      { pubkey: multisigSigner, isWritable: false, isSigner: false },
    ];
    const txSize = 1000; // TODO: tighter bound.
    const transaction = new Account();
    const tx = await multisigClient.rpc.createTransaction(
      BPF_LOADER_UPGRADEABLE_PID,
      accs,
      data,
      {
        accounts: {
          multisig,
          transaction: transaction.publicKey,
          proposer: multisigClient.provider.wallet.publicKey,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [transaction],
        instructions: [
          await multisigClient.account.transaction.createInstruction(
            transaction,
            // @ts-ignore
            txSize
          ),
        ],
      }
    );
    enqueueSnackbar("Transaction created", {
      variant: "success",
      action: <ViewTransactionOnExplorerButton signature={tx} />,
    });
    didAddTransaction(transaction.publicKey);
    onClose();
  };

  return (
    <div
      style={{
        background: "#f1f0f0",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      <TextField
        fullWidth
        style={{ marginTop: "16px" }}
        label="Program ID"
        value={programId}
        onChange={(e) => setProgramId(e.target.value as string)}
      />
      <TextField
        style={{ marginTop: "16px" }}
        fullWidth
        label="New program buffer"
        value={buffer}
        onChange={(e) => setBuffer(e.target.value as string)}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "16px",
          paddingBottom: "16px",
        }}
      >
        <Button onClick={() => createTransactionAccount()}>
          Create upgrade
        </Button>
      </div>
    </div>
  );
}

// @ts-ignore
function icon(tx, multisigClient) {
  if (tx.account.programId.equals(BPF_LOADER_UPGRADEABLE_PID)) {
    return <BuildIcon />;
  }
  if (tx.account.programId.equals(multisigClient.programId)) {
    const setThresholdSighash = multisigClient.coder.sighash(
      "global",
      "change_threshold"
    );
    if (setThresholdSighash.equals(tx.account.data.slice(0, 8))) {
      return <GavelIcon />;
    }
    const setOwnersSighash = multisigClient.coder.sighash(
      "global",
      "set_owners"
    );
    if (setOwnersSighash.equals(tx.account.data.slice(0, 8))) {
      return <SupervisorAccountIcon />;
    }
  }
  if (idl.IDL_TAG.equals(tx.account.data.slice(0, 8))) {
    return <DescriptionIcon />;
  }
  return <ReceiptIcon />;
}

// @ts-ignore
function changeThresholdData(multisigClient, threshold) {
  return multisigClient.coder.instruction.encode("change_threshold", {
    threshold: new BN(threshold),
  });
}

// @ts-ignore
function setOwnersData(multisigClient, owners) {
  return multisigClient.coder.instruction.encode("set_owners", {
    owners,
  });
}
