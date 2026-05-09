use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use anchor_lang::solana_program::rent::Rent;

declare_id!("nxs1111111111111111111111111111111111111111");

#[program]
pub mod nexus_stream {
    use super::*;

    pub fn tip_sol(ctx: Context<TipSol>, lamports: u64) -> Result<()> {
        require!(lamports > 0, NexusStreamError::ZeroAmount);

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.tipper.to_account_info(),
                    to: ctx.accounts.streamer.to_account_info(),
                },
            ),
            lamports,
        )?;

        emit!(TipEvent {
            tipper: ctx.accounts.tipper.key(),
            streamer: ctx.accounts.streamer.key(),
            lamports,
        });
        Ok(())
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_index: u64,
        question_hash: [u8; 32],
        cutoff_ts: i64,
    ) -> Result<()> {
        let clock = Clock::get()?;

        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.market_index = market_index;
        market.question_hash = question_hash;
        market.cutoff_ts = cutoff_ts;
        market.created_ts = clock.unix_timestamp;
        market.resolved = false;
        market.winning_side = 0;
        market.total_yes = 0;
        market.total_no = 0;
        market.snapshot_vault_total = 0;
        market.winner_denominator_stake = 0;
        market.bump = ctx.bumps.market;
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, side: u8, lamports: u64) -> Result<()> {
        require!(
            Clock::get()?.unix_timestamp <= ctx.accounts.market.cutoff_ts,
            NexusStreamError::BettingClosed
        );
        require!(
            !ctx.accounts.market.resolved,
            NexusStreamError::AlreadyResolved
        );
        require!(matches!(side, 1 | 2), NexusStreamError::InvalidSide);
        require!(lamports > 0, NexusStreamError::ZeroAmount);

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.market.to_account_info(),
                },
            ),
            lamports,
        )?;

        let market_key = ctx.accounts.market.key();
        let bet = &mut ctx.accounts.bet;
        if bet.market == Pubkey::default() {
            bet.market = market_key;
            bet.user = ctx.accounts.user.key();
            bet.yes_lamports = 0;
            bet.no_lamports = 0;
            bet.claimed = false;
        }

        require_eq!(
            bet.user,
            ctx.accounts.user.key(),
            NexusStreamError::InvalidBetOwner
        );
        require_eq!(bet.market, market_key, NexusStreamError::WrongMarket);

        if side == 1 {
            bet.yes_lamports = bet
                .yes_lamports
                .checked_add(lamports)
                .ok_or(error!(NexusStreamError::Math))?;
            ctx.accounts.market.total_yes = ctx
                .accounts
                .market
                .total_yes
                .checked_add(lamports)
                .ok_or(error!(NexusStreamError::Math))?;
        } else {
            bet.no_lamports = bet
                .no_lamports
                .checked_add(lamports)
                .ok_or(error!(NexusStreamError::Math))?;
            ctx.accounts.market.total_no = ctx
                .accounts
                .market
                .total_no
                .checked_add(lamports)
                .ok_or(error!(NexusStreamError::Math))?;
        }

        emit!(BetPlaced {
            market: ctx.accounts.market.key(),
            user: ctx.accounts.user.key(),
            side,
            lamports,
        });
        Ok(())
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, winning_side: u8) -> Result<()> {
        require!(
            Clock::get()?.unix_timestamp >= ctx.accounts.market.cutoff_ts,
            NexusStreamError::TooEarlyResolve
        );
        require!(matches!(winning_side, 1 | 2), NexusStreamError::InvalidSide);
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, NexusStreamError::AlreadyResolved);

        let winning_total = match winning_side {
            1 => market.total_yes,
            2 => market.total_no,
            _ => return err!(NexusStreamError::InvalidSide),
        };
        require!(winning_total > 0, NexusStreamError::NoWinnersPool);

        market.resolved = true;
        market.winning_side = winning_side;
        let account_len = Market::INIT_SPACE
            .checked_add(8)
            .ok_or(error!(NexusStreamError::Math))?;
        let rent_floor = Rent::get()?.minimum_balance(account_len);
        let account_lamps = ctx.accounts.market.to_account_info().lamports();
        let pooled = account_lamps.saturating_sub(rent_floor);

        market.snapshot_vault_total = pooled;
        market.winner_denominator_stake = winning_total;

        emit!(MarketResolved {
            market: market.key(),
            winning_side,
            snapshot_total: pooled,
        });
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;
        require!(market.resolved, NexusStreamError::NotResolved);
        require!(!bet.claimed, NexusStreamError::AlreadyClaimed);

        let user_stake = match market.winning_side {
            1 => bet.yes_lamports,
            2 => bet.no_lamports,
            _ => return err!(NexusStreamError::OutcomeUnset),
        };
        require!(user_stake > 0, NexusStreamError::NotAWinner);

        let payout_u128 =
            ((market.snapshot_vault_total as u128).checked_mul(user_stake as u128)).ok_or(
                NexusStreamError::Math,
            )? / (market.winner_denominator_stake as u128);
        let payout = payout_u128
            .try_into()
            .map_err(|_| error!(NexusStreamError::Math))?;

        let account_len = Market::INIT_SPACE
            .checked_add(8)
            .ok_or(error!(NexusStreamError::Math))?;
        let rent_floor = Rent::get()?.minimum_balance(account_len);
        let account_lamps = ctx.accounts.market.to_account_info().lamports();
        let available_surplus = account_lamps.saturating_sub(rent_floor);
        require!(
            payout <= available_surplus,
            NexusStreamError::InsufficientFunds
        );

        bet.claimed = true;

        let authority_key = market.authority;
        let market_idx = market.market_index;
        let bump = &[market.bump];
        let seeds: &[&[u8]] = &[
            b"market",
            authority_key.as_ref(),
            &market_idx.to_le_bytes(),
            bump,
        ];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.market.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                },
                &[seeds],
            ),
            payout,
        )?;

        emit!(BetClaimed {
            market: market.key(),
            user: ctx.accounts.user.key(),
            payout,
        });
        Ok(())
    }

    pub fn grant_milestone(
        ctx: Context<GrantMilestone>,
        milestone_id: u64,
        label_hash: [u8; 32],
    ) -> Result<()> {
        let rec = &mut ctx.accounts.record;
        rec.streamer = ctx.accounts.streamer.key();
        rec.viewer = ctx.accounts.viewer.key();
        rec.milestone_id = milestone_id;
        rec.label_hash = label_hash;
        rec.ts = Clock::get()?.unix_timestamp;

        emit!(MilestoneGranted {
            streamer: rec.streamer,
            viewer: rec.viewer,
            milestone_id,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TipSol<'info> {
    #[account(mut)]
    pub tipper: Signer<'info>,
    /// CHECK streamer SOL wallet receives tips
    #[account(mut)]
    pub streamer: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(market_index: u64)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [
            b"market",
            authority.key().as_ref(),
            market_index.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub market: Account<'info, Market>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [
            b"market",
            market.authority.as_ref(),
            market.market_index.to_le_bytes().as_ref(),
        ], bump = market.bump)]
    pub market: Account<'info, Market>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        constraint = market.authority == authority.key(),
        seeds = [
            b"market",
            market.authority.as_ref(),
            market.market_index.to_le_bytes().as_ref(),
        ],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        constraint = market.resolved @ NexusStreamError::NotResolved,
        seeds = [
            b"market",
            market.authority.as_ref(),
            market.market_index.to_le_bytes().as_ref(),
        ],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        constraint = bet.user == user.key(),
        constraint = bet.market == market.key(),
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_id: u64, label_hash: [u8; 32])]
pub struct GrantMilestone<'info> {
    #[account(mut)]
    pub streamer: Signer<'info>,
    /// CHECK anyone can appear as unlocked viewer milestone target
    pub viewer: UncheckedAccount<'info>,
    #[account(
        init,
        payer = streamer,
        space = 8 + MilestoneRecord::INIT_SPACE,
        seeds = [
            b"milestone",
            streamer.key().as_ref(),
            viewer.key().as_ref(),
            milestone_id.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub record: Account<'info, MilestoneRecord>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority: Pubkey,
    pub market_index: u64,
    pub question_hash: [u8; 32],
    pub created_ts: i64,
    pub cutoff_ts: i64,
    pub resolved: bool,
    pub winning_side: u8,
    pub total_yes: u64,
    pub total_no: u64,
    pub snapshot_vault_total: u64,
    pub winner_denominator_stake: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub market: Pubkey,
    pub user: Pubkey,
    pub yes_lamports: u64,
    pub no_lamports: u64,
    pub claimed: bool,
}

#[account]
#[derive(InitSpace)]
pub struct MilestoneRecord {
    pub streamer: Pubkey,
    pub viewer: Pubkey,
    pub milestone_id: u64,
    pub label_hash: [u8; 32],
    pub ts: i64,
}

#[event]
pub struct TipEvent {
    pub tipper: Pubkey,
    pub streamer: Pubkey,
    pub lamports: u64,
}

#[event]
pub struct BetPlaced {
    pub market: Pubkey,
    pub user: Pubkey,
    pub side: u8,
    pub lamports: u64,
}

#[event]
pub struct MarketResolved {
    pub market: Pubkey,
    pub winning_side: u8,
    pub snapshot_total: u64,
}

#[event]
pub struct BetClaimed {
    pub market: Pubkey,
    pub user: Pubkey,
    pub payout: u64,
}

#[event]
pub struct MilestoneGranted {
    pub streamer: Pubkey,
    pub viewer: Pubkey,
    pub milestone_id: u64,
}

#[error_code]
pub enum NexusStreamError {
    #[msg("Amount must be positive")]
    ZeroAmount,
    #[msg("Bet window already closed")]
    BettingClosed,
    #[msg("Market already resolved")]
    AlreadyResolved,
    #[msg("Invalid side (must be YES=1 / NO=2)")]
    InvalidSide,
    #[msg("Math overflow")]
    Math,
    #[msg("Trying to finalize before cutoff")]
    TooEarlyResolve,
    #[msg("No winning stake captured")]
    NoWinnersPool,
    #[msg("Market not resolved yet")]
    NotResolved,
    #[msg("Already claimed winnings")]
    AlreadyClaimed,
    #[msg("Outcome missing")]
    OutcomeUnset,
    #[msg("No winning stake")]
    NotAWinner,
    #[msg("Insufficient lamports minus rent safeguard")]
    InsufficientFunds,
    #[msg("Wrong bet wallet")]
    InvalidBetOwner,
    #[msg("Bet targets another market")]
    WrongMarket,
}
