-- Schéma Supabase — « Deux comme nous »
-- À exécuter dans Supabase → SQL Editor.

-- Combinaisons d'archétypes déjà produites (cache print-on-demand).
create table if not exists public.combos (
  combo_id     text primary key,
  archetype1   text not null,
  archetype2   text not null,
  cree_le      timestamptz not null default now()
);

-- Commandes payées.
create table if not exists public.commandes (
  id               uuid primary key default gen_random_uuid(),
  cree_le          timestamptz not null default now(),
  combo_id         text not null,
  archetype1       text not null,
  archetype2       text not null,
  prenom1          text not null,
  prenom2          text not null,
  email            text,
  statut           text not null,           -- 'a_produire' | 'cache'
  paiement         text not null,           -- 'stripe' | 'simulé'
  ref              text,                    -- id de session Stripe
  montant_centimes integer not null default 0
);

create index if not exists commandes_combo_idx on public.commandes (combo_id);

-- Suivi de production : rempli par commandes.py quand le PDF client est fait.
-- (Sur une base déjà créée, exécuter simplement cette ligne dans SQL Editor.)
alter table public.commandes add column if not exists traitee_le timestamptz;

-- Row Level Security : accès uniquement via la clé service_role (côté serveur).
alter table public.commandes enable row level security;
alter table public.combos enable row level security;

-- Bucket PRIVÉ pour les photos de l'édition sur mesure (supprimées après
-- génération du livre). Accès uniquement via la clé service_role.
insert into storage.buckets (id, name, public)
values ('sur-mesure', 'sur-mesure', false)
on conflict (id) do nothing;
