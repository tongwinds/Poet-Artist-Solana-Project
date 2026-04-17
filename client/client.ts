//////////////////// Imports ////////////////////
import { PublicKey } from "@solana/web3.js";

////////////////// Constantes ////////////////////
const NOMBRE_BIBLIOTECA = "Alejandria";
const owner = pg.wallet.publicKey;

//////////////////// Logs base ////////////////////
console.log("My address:", owner.toBase58());
const balance = await pg.connection.getBalance(owner);
console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);

//////////////////// PDA Biblioteca ////////////////////
// En Rust: seeds = [b"biblioteca", owner.key().as_ref()]
function pdaBiblioteca(ownerPk: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("biblioteca"), ownerPk.toBuffer()],
    pg.PROGRAM_ID
  );
}

//////////////////// Helpers ////////////////////
async function fetchBiblioteca(pda_biblioteca: PublicKey) {
  // Anchor/Playground: pg.program.account.<nombreCuenta>.fetch(pubkey)
  return await pg.program.account.biblioteca.fetch(pda_biblioteca);
}

function printLibros(bibliotecaAccount: any) {
  const libros = bibliotecaAccount.libros as any[];
  if (!libros || libros.length === 0) {
    console.log("Biblioteca vacía");
    return;
  }

  console.log(`Libros (${libros.length}):`);
  for (let i = 0; i < libros.length; i++) {
    const l = libros[i];
    console.log(
      `#${i + 1} -> nombre="${l.nombre}", paginas=${l.paginas}, disponible=${
        l.disponible
      }`
    );
  }
}

//////////////////// Instrucciones ////////////////////
async function crearBiblioteca(nombreBiblioteca: string) {
  const [pda_biblioteca] = pdaBiblioteca(owner);

  try {
    const existing = await fetchBiblioteca(pda_biblioteca);
    console.log("Biblioteca ya existe en:", pda_biblioteca.toBase58());
    console.log("Owner guardado:", existing.owner.toBase58());
    console.log("Nombre guardado:", existing.nombre);
    return;
  } catch (_) {}

  const txHash = await pg.program.methods
    .crearBiblioteca(nombreBiblioteca)
    .accounts({
      owner: owner,
      biblioteca: pda_biblioteca,
      // systemProgram: web3.SystemProgram.programId, // normalmente Anchor lo infiere; si falla, descomentar
    })
    .rpc();

  console.log("crearBiblioteca tx:", txHash);
  console.log("Biblioteca PDA:", pda_biblioteca.toBase58());

  const bibliotecaAccount = await fetchBiblioteca(pda_biblioteca);
  console.log("Estado inicial:");
  console.log("Owner:", bibliotecaAccount.owner.toBase58());
  console.log("Nombre:", bibliotecaAccount.nombre);
  printLibros(bibliotecaAccount);
}

async function agregarLibro(nombreLibro: string, paginas: number) {
  const [pda_biblioteca] = pdaBiblioteca(owner);

  const txHash = await pg.program.methods
    .agregarLibro(nombreLibro, paginas)
    .accounts({
      owner: owner,
      biblioteca: pda_biblioteca,
    })
    .rpc();

  console.log("agregarLibro tx:", txHash);

  const bibliotecaAccount = await fetchBiblioteca(pda_biblioteca);
  printLibros(bibliotecaAccount);
}

async function eliminarLibro(nombreLibro: string) {
  const [pda_biblioteca] = pdaBiblioteca(owner);

  const txHash = await pg.program.methods
    .eliminarLibro(nombreLibro)
    .accounts({
      owner: owner,
      biblioteca: pda_biblioteca,
    })
    .rpc();

  console.log("eliminarLibro tx:", txHash);

  const bibliotecaAccount = await fetchBiblioteca(pda_biblioteca);
  printLibros(bibliotecaAccount);
}

async function alternarEstado(nombreLibro: string) {
  const [pda_biblioteca] = pdaBiblioteca(owner);

  const txHash = await pg.program.methods
    .alternarEstado(nombreLibro)
    .accounts({
      owner: owner,
      biblioteca: pda_biblioteca,
    })
    .rpc();

  console.log("alternarEstado tx:", txHash);

  const bibliotecaAccount = await fetchBiblioteca(pda_biblioteca);
  printLibros(bibliotecaAccount);
}

async function verLibrosFetch() {
  const [pda_biblioteca] = pdaBiblioteca(owner);

  const bibliotecaAccount = await fetchBiblioteca(pda_biblioteca);
  console.log("Biblioteca PDA:", pda_biblioteca.toBase58());
  console.log("Owner:", bibliotecaAccount.owner.toBase58());
  console.log("Nombre:", bibliotecaAccount.nombre);
  printLibros(bibliotecaAccount);
}

//////////////////// Demo runner ////////////////////
// await crearBiblioteca(NOMBRE_BIBLIOTECA);

// Pruebas rápidas
await agregarLibro("El nombre del viento", 662);
await agregarLibro("Mistborn", 541);
await alternarEstado("Mistborn");
await eliminarLibro("El nombre del viento");
await verLibrosFetch();
