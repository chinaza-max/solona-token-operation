// This uses "@metaplex-foundation/mpl-token-metadata@2" to create tokens
import "dotenv/config";
import {
  getKeypairFromEnvironment,
  getExplorerLink,
} from "@solana-developers/helpers";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createCreateMetadataAccountV3Instruction ,createUpdateMetadataAccountV2Instruction} from "@metaplex-foundation/mpl-token-metadata";


const user = getKeypairFromEnvironment("SECRET_KEY");
const connection = new Connection(clusterApiUrl("devnet"));




console.log(
  `🔑 Loaded our keypair securely, using an env file! Our public key is: ${user.publicKey.toBase58()}`
);
console.log("Receiver Public Key:", user.publicKey.toString());


const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// Subtitute in your token mint account
const tokenMintAccount = new PublicKey(process.env.YOUR_TOKEN_MINT_ADDRESS_HERE);

const metadataData = {
  name: "Chinaza Solana Token",
  symbol: "chinaza",
  // Arweave / IPFS / Pinata etc link using metaplex standard for off-chain data
  uri: "https://arweave.net/1234",
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null,
};

const metadataPDAAndBump = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    tokenMintAccount.toBuffer(),
  ],
  TOKEN_METADATA_PROGRAM_ID
);

const metadataPDA = metadataPDAAndBump[0];

async function main() {
    const metadataAccountInfo = await connection.getAccountInfo(metadataPDA);
  
    const transaction = new Transaction();
  
    if (metadataAccountInfo === null) {
      // Metadata account doesn't exist, create it
      const createMetadataAccountInstruction = createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPDA,
          mint: tokenMintAccount,
          mintAuthority: user.publicKey,
          payer: user.publicKey,
          updateAuthority: user.publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            collectionDetails: null,
            data: metadataData,
            isMutable: true,
          },
        }
      );
  
      transaction.add(createMetadataAccountInstruction);
  
      try {
        const transactionSignature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [user]
        );
  
        const transactionLink = getExplorerLink(
          "transaction",
          transactionSignature,
          "devnet"
        );
  
        console.log(`✅ Transaction confirmed, explorer link is: ${transactionLink}!`);
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    } else {
      // Metadata account exists, update it
      const updateMetadataAccountInstruction = createUpdateMetadataAccountV2Instruction(
        {
          metadata: metadataPDA,
          updateAuthority: user.publicKey,
        },
        {
          updateMetadataAccountArgsV2: {
            data: metadataData,
            updateAuthority: user.publicKey,
            primarySaleHappened: null,
            isMutable: true,
          },
        }
      );
  
      transaction.add(updateMetadataAccountInstruction);
  
      try {
        const transactionSignature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [user]
        );
  
        const transactionLink = getExplorerLink(
          "transaction",
          transactionSignature,
          "devnet"
        );
  
        console.log(`✅ Metadata updated, explorer link is: ${transactionLink}!`);
      } catch (error) {
        console.error("Update transaction failed:", error);
      }
    }
  
    const tokenMintLink = getExplorerLink(
      "address",
      tokenMintAccount.toString(),
      "devnet"
    );
  
    console.log(`✅ Look at the token mint again: ${tokenMintLink}!`);
  }
  
  main().catch((err) => {
    console.error(err);
  });