type PetRow = {
  name: string;
  species: string;
  breed: string | null;
  age_years: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  photo_url: string | null;
  status: string;
};

export function PetFields({
  defaults,
  showId,
  petId,
}: {
  defaults?: Partial<PetRow>;
  showId?: boolean;
  petId?: string;
}) {
  const d = defaults ?? {};
  return (
    <>
      {showId && petId ? (
        <input type="hidden" name="id" value={petId} />
      ) : null}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={d.name ?? ""}
          className="w-full rounded-2xl border-0 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] outline-none ring-2 ring-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] focus:ring-[var(--color-secondary-bright)]"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="species"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          Species
        </label>
        <select
          id="species"
          name="species"
          defaultValue={d.species ?? "dog"}
          className="w-full rounded-2xl border-0 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] outline-none ring-2 ring-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] focus:ring-[var(--color-secondary-bright)]"
        >
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </select>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="breed"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          Breed
        </label>
        <input
          id="breed"
          name="breed"
          type="text"
          defaultValue={d.breed ?? ""}
          className="w-full rounded-2xl border-0 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] outline-none ring-2 ring-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] focus:ring-[var(--color-secondary-bright)]"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="age_years"
            className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
          >
            Age (years)
          </label>
          <input
            id="age_years"
            name="age_years"
            type="number"
            min={0}
            step={1}
            defaultValue={d.age_years ?? ""}
            className="w-full rounded-2xl border-0 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] outline-none ring-2 ring-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] focus:ring-[var(--color-secondary-bright)]"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="weight_kg"
            className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
          >
            Weight (kg)
          </label>
          <input
            id="weight_kg"
            name="weight_kg"
            type="number"
            min={0}
            step={0.1}
            defaultValue={d.weight_kg ?? ""}
            className="w-full rounded-2xl border-0 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] outline-none ring-2 ring-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] focus:ring-[var(--color-secondary-bright)]"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="activity_level"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          Activity
        </label>
        <input
          id="activity_level"
          name="activity_level"
          type="text"
          placeholder="e.g. High"
          defaultValue={d.activity_level ?? ""}
          className="w-full rounded-2xl border-0 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] outline-none ring-2 ring-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] focus:ring-[var(--color-secondary-bright)]"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="photo_url"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          Photo URL
        </label>
        <input
          id="photo_url"
          name="photo_url"
          type="url"
          placeholder="https://…"
          defaultValue={d.photo_url ?? ""}
          className="w-full rounded-2xl border-0 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] outline-none ring-2 ring-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] focus:ring-[var(--color-secondary-bright)]"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="status"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={d.status ?? "healthy"}
          className="w-full rounded-2xl border-0 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] outline-none ring-2 ring-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] focus:ring-[var(--color-secondary-bright)]"
        >
          <option value="healthy">Healthy</option>
          <option value="checkup">Checkup due</option>
        </select>
      </div>
    </>
  );
}
