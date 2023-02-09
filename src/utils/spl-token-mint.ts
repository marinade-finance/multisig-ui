import { Provider, web3 } from '@project-serum/anchor'
import { MintInfo, Token } from '@solana/spl-token'
import { getMintClient } from './spl-token'
import { tokenBalanceToNumber } from './conversion'

export class MintHelper {
  private constructor(
    private readonly anchorProvider: Provider,
    public readonly address: web3.PublicKey
  ) { }

  static build(anchorProvider: Provider, mintAddress: web3.PublicKey): MintHelper {
    return new MintHelper(anchorProvider, mintAddress)
  }

  mintClient = (): Token => getMintClient(this.anchorProvider, this.address)
  mintInfo = (): Promise<MintInfo> => this.mintClient().getMintInfo()

  /**
   * Returns Total supply as a number with decimals
   * @param mintInfoCached optional
   * @returns 
   */
  async totalSupply(mintInfoCached?: MintInfo): Promise<number> {
    const mintInfo = mintInfoCached ?? await this.mintInfo()
    return tokenBalanceToNumber(mintInfo.supply, mintInfo.decimals)
  }

  /**
   * @deprecated use totalSupply() instead
   */
  async tokenBalance(mintInfoCached?: MintInfo): Promise<number> {
    return this.totalSupply(mintInfoCached)
  }

}
