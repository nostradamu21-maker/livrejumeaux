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
  langue           text not null default 'fr', -- langue du TEXTE du livre
  montant_centimes integer not null default 0
);

create index if not exists commandes_combo_idx on public.commandes (combo_id);

-- Suivi de production : rempli par commandes.py quand le PDF client est fait.
-- (Sur une base déjà créée, exécuter simplement ces lignes dans SQL Editor.)
alter table public.commandes add column if not exists traitee_le timestamptz;
alter table public.commandes add column if not exists langue text not null default 'fr';

-- Expédition Gelato automatisée (expedier.py) : adresse structurée collectée
-- au paiement Stripe, référence de la commande Gelato et date d'envoi.
alter table public.commandes add column if not exists adresse jsonb;      -- {name,line1,line2,postCode,city,state,country}
alter table public.commandes add column if not exists telephone text;
alter table public.commandes add column if not exists produit text not null default 'livre'; -- 'livre' | 'affiche'
alter table public.commandes add column if not exists taille text;        -- affiche : 21x30|30x40|40x50|50x70
alter table public.commandes add column if not exists gelato_id text;     -- id de commande Gelato (draft ou réelle)
alter table public.commandes add column if not exists expedie_le timestamptz;

-- Row Level Security : accès uniquement via la clé service_role (côté serveur).
alter table public.commandes enable row level security;
alter table public.combos enable row level security;

-- Bucket PRIVÉ pour les photos de l'édition sur mesure (supprimées après
-- génération du livre). Accès uniquement via la clé service_role.
insert into storage.buckets (id, name, public)
values ('sur-mesure', 'sur-mesure', false)
on conflict (id) do nothing;

-- Bucket PRIVÉ pour les PDF d'impression transmis à Gelato via liens signés
-- (expedier.py). Nettoyable après expédition.
insert into storage.buckets (id, name, public)
values ('impressions', 'impressions', false)
on conflict (id) do nothing;

-- TRI WEB MOBILE (tri_web.py + /admin/tri) : les variantes générées d'un livre
-- sont téléversées dans le bucket privé `tri`, Simon choisit depuis son
-- téléphone, le pipeline rapatrie les choix dans livre.yaml.
insert into storage.buckets (id, name, public)
values ('tri', 'tri', false)
on conflict (id) do nothing;

create table if not exists public.tris (
  livre_id  text primary key,
  cree_le   timestamptz not null default now(),
  unites    jsonb not null default '[]',  -- [{unite, apercu?, variantes: [chemins bucket]}]
  choix     jsonb,                        -- {unite: 'v1' | 'v2' | 'regen'}
  notes     jsonb,                        -- {unite: consigne de correction (regen)}
  termine   boolean not null default false
);
alter table public.tris add column if not exists notes jsonb;
alter table public.tris enable row level security;

-- Suivi de l'édition sur mesure : photos du client, variantes de personnages
-- générées après paiement, et choix du client.
create table if not exists public.sur_mesure (
  ref         text primary key,          -- id de session Stripe
  cree_le     timestamptz not null default now(),
  monozygote  boolean not null default true,
  accessoire  text,                          -- signe distinctif du 2e (monozygotes)
  relation    text,                          -- lien du demandeur avec les enfants
  consentement boolean not null default false, -- majeur + autorisation photo certifiés
  sexe1       text,                          -- 'garcon' | 'fille' → accords du texte
  sexe2       text,                          -- monozygotes : identique à sexe1
  prenom1     text not null default '',
  prenom2     text not null default '',
  photos      jsonb not null default '[]',  -- chemins bucket
  variantes   jsonb,                        -- {"1": [chemins], "2": [...]}
  choix       jsonb                         -- {"1": chemin retenu, "2": ...}
);
-- Colonnes ajoutées après coup : `create table if not exists` ci-dessus NE
-- les ajoute PAS à une table déjà créée depuis une version antérieure. Ces
-- ALTER sont idempotents et réparent une table `sur_mesure` incomplète
-- (sans eux, l'insertion du webhook échoue en silence → table qui reste vide).
alter table public.sur_mesure add column if not exists accessoire   text;
alter table public.sur_mesure add column if not exists relation     text;
alter table public.sur_mesure add column if not exists consentement boolean not null default false;
alter table public.sur_mesure add column if not exists sexe1        text;
alter table public.sur_mesure add column if not exists sexe2        text;
alter table public.sur_mesure enable row level security;
