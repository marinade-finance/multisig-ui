import { Program } from "@project-serum/anchor";
import { getAssociatedTokenAccountAndInstruction, getMintClient, getTokenAccountInfo } from "../utils/spl-token";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'

export const MNDEMintAddress = new PublicKey("MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey")
export const MNDETreasuryGrill = new PublicKey("GR1LBT4cU89cJWE74CP6BsJTf2kriQ9TX59tbDsfxgSi")

export async function mndeTransferInstruction(
        rpcUrl:string, 
        multisigClient: Program, 
        signerAuth: PublicKey, 
        destinationAccountString: string, 
        amount: number): Promise<TransactionInstruction> {

    const destinationAccount = new PublicKey(destinationAccountString)

    const MNDEMint = getMintClient(multisigClient.provider, MNDEMintAddress)

    // check from-account (code ready to implement other SPL-tokens)
    const fromAccount =  rpcUrl.includes("devnet")? new PublicKey("MnDaY5b8hVYTE24ujFC2qHLDPcLzEetNyhFVbr9mFb1") : MNDETreasuryGrill;
    let fromAccountInfo;
    try {
        fromAccountInfo = await getTokenAccountInfo(MNDEMint, MNDETreasuryGrill)
    }
    catch (ex) {
        throw Error(ex.message + " " + MNDETreasuryGrill.toBase58())
    }

    const fromAccountMintAddress = fromAccountInfo.mint
    if (!fromAccountMintAddress.equals(MNDEMintAddress)) {
        throw Error("From account mint should be MNDE")
    }
    // check from-account owner is multisig auth
    if (!fromAccountInfo.owner.equals(signerAuth)) {
        throw Error(
            `From Token-account.owner ${fromAccountInfo.address.toBase58()} is ${fromAccountInfo.owner.toBase58()} but multisig auth is ${signerAuth.toBase58()}`
        );
    }

    // check destination account
    const destAccountInfo = await multisigClient.provider.connection.getAccountInfo(destinationAccount)
    if (!destAccountInfo) throw Error(`cannot read account ${destinationAccount.toBase58()}`)

    let destinationATA: PublicKey;
    // is destination account a token account?
    if (destAccountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
        // verify the mint
        const destTokenAccountInfo = await getTokenAccountInfo(MNDEMint, destinationAccount)
        if (destTokenAccountInfo.mint !== MNDEMintAddress) {
            throw Error(`destination account should be a MNDE token account, but mint is ${destTokenAccountInfo.mint.toBase58()}`)
        }
        destinationATA = destinationAccount
    }
    else {
        // consider it is a main account, find/create ATA
        const { associatedTokenAccountAddress: computedATA, createAssociateTokenInstruction } = 
            await getAssociatedTokenAccountAndInstruction(multisigClient.provider, MNDEMintAddress, destinationAccount, multisigClient.provider.wallet.publicKey)
        if (createAssociateTokenInstruction) {
            // ATA does not exists, create it now
            const tx = new Transaction()
            tx.add(createAssociateTokenInstruction)
            try {
                await multisigClient.provider.send(tx)
            }
            catch (ex) {
                throw Error(`${ex.message} creating MNDE ATA for destination account`)
            }
        }
        destinationATA = computedATA
    }

    // get fromMintClient
    const fromMintClient = getMintClient(multisigClient.provider, MNDEMintAddress)
    const fromMintInfo = await fromMintClient.getMintInfo()

    // convert from units to atoms (akin to SOL to lamports)
    let power = 10 ** fromMintInfo.decimals;
    let atomsAmount: BigInt = BigInt((amount * power).toFixed(0));

    // create the SPL-Token transfer instruction
    let instruction = Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        fromAccount,
        destinationATA,
        signerAuth,
        [],
        Number(atomsAmount.toString())
    );
    // let instruction = Token.createTransferCheckedInstruction(
    //     TOKEN_PROGRAM_ID,
    //     fromAccount,
    //     fromAccountMintAddress,
    //     destinationATA,
    //     signerAuth,
    //     [],
    //     Number(atomsAmount.toString()),
    //     fromMintInfo.decimals
    // );

    return instruction
}

