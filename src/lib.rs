use anchor_lang::prelude::*;

declare_id!("3saJFmuArB4WQcna8deXe5ijLbeFc4Vhwn4nKFjLn7AU");

#[program]
pub mod biblioteca {
    use super::*;

    pub fn crear_biblioteca(ctx: Context<NuevaBiblioteca>, nombre: String) -> Result<()> {
        let owner = ctx.accounts.owner.key();
        let libros: Vec<Libro> = Vec::new();
        
        ctx.accounts.biblioteca.set_inner(Biblioteca {
            owner,
            nombre,
            libros,
        });

        msg!("Biblioteca creada exitosamente!");
        Ok(())
    }

    pub fn agregar_libro(ctx: Context<NuevoLibro>, nombre: String, paginas: u16) -> Result<()> {
        // Corrección: Usar == para comparar y accounts en plural
        require!(ctx.accounts.biblioteca.owner == ctx.accounts.owner.key(), Errores::NoEresElOwner);

        let libro = Libro {
            nombre,
            paginas,
            disponible: true, // Faltaba definir el valor inicial de 'disponible'
        };

        ctx.accounts.biblioteca.libros.push(libro);
        Ok(())
    }

    // Corrección: Se agregó el Context
    pub fn ver_libro(context: Context<NuevoLibro>) -> Result<()> {
        require!(context.accounts.biblioteca.owner == context.accounts.owner.key(), Errores::NoEresElOwner);

        msg!("La lista de libros actualmente es: {:#?}", 
        context.accounts.biblioteca.libros);

        Ok(())
    }

    pub fn eliminar_libro (context:Context<NuevoLibro>, nombre: String) -> Result<()> {
        require!(context.accounts.biblioteca.owner == context.accounts.owner.key(), Errores::NoEresElOwner);
       
       let libros: &mut Vec<Libro> = &mut context.accounts.biblioteca.libros;

        for libro in 0..libros.len(){
            if libros[libro].nombre == nombre {
            libros.remove(libro);
            msg!("Libro {} eliminado!", nombre);
            return Ok(());
        }
        }
        Err(Errores::LibroNoExiste.into())
    }

    pub fn alternar_estado(context:Context<NuevoLibro>, nombre: String) -> Result<()>{
        require!(context.accounts.biblioteca.owner == context.accounts.owner.key(), Errores::NoEresElOwner);        

        let libros: &mut Vec<Libro> = &mut context.accounts.biblioteca.libros;

        for libro in 0..libros.len(){
            let estado = libros[libro].disponible;
            
            if libros[libro].nombre == nombre{
                let nuevo_estado: bool = !estado;
                libros[libro].disponible = nuevo_estado;  
                msg!("El libro {} ahora está {}", nombre, nuevo_estado);              
                return Ok(());
            }

        }
        Err(Errores::LibroNoExiste.into())

    }
}

#[error_code]
pub enum Errores {
    #[msg("Error: No eres el propietario de la biblioteca que deseas modificar.")]
    NoEresElOwner,

    #[msg("Error: El libro proporcionado no existe.")]
    LibroNoExiste
}

#[account]
#[derive(InitSpace)]
pub struct Biblioteca {
    pub owner: Pubkey,
    #[max_len(60)]
    pub nombre: String,
    #[max_len(10)]
    pub libros: Vec<Libro>,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub struct Libro {
    #[max_len(60)]
    pub nombre: String,
    pub paginas: u16,
    pub disponible: bool,
}

#[derive(Accounts)]
pub struct NuevaBiblioteca<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    // Corrección: Se quitó el espacio entre ] y (
    #[account(
        init,
        payer = owner,
        space = 8 + Biblioteca::INIT_SPACE, 
        seeds = [b"biblioteca", owner.key().as_ref()],
        bump
    )]
    pub biblioteca: Account<'info, Biblioteca>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct NuevoLibro<'info> {
    pub owner: Signer<'info>,
    #[account(mut)]
    pub biblioteca: Account<'info, Biblioteca>,
}
