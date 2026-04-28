-- Species for RAG retrieval (vet-rag matches chunk metadata.species).
alter table public.pets
  add column if not exists species text;

update public.pets set species = coalesce(species, 'dog');

alter table public.pets alter column species set default 'dog';

alter table public.pets alter column species set not null;

alter table public.pets drop constraint if exists pets_species_check;

alter table public.pets
  add constraint pets_species_check check (species in ('dog', 'cat'));
