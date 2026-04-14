-- Demo veterinarians for directory (safe to re-apply: conflicts ignored)
insert into public.veterinarians
  (id, name, credentials, title, specialties, years_experience, image_url, is_active, sort_order)
values
  (
    'a1000000-0000-4000-b000-000000000001',
    'Dr. Sarah Woof, DVM',
    'DVM',
    'Chief Medical Officer',
    array['Internal Medicine', 'AI Safety'],
    15,
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
    true,
    1
  ),
  (
    'a1000000-0000-4000-b000-000000000002',
    'Dr. James Paws, DVM',
    'DVM',
    'Emergency & Triage',
    array['Emergency', 'Pain Management'],
    12,
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
    true,
    2
  ),
  (
    'a1000000-0000-4000-b000-000000000003',
    'Dr. Mia Clawson, DVM',
    'DVM',
    'Dermatology Lead',
    array['Dermatology', 'Allergy'],
    10,
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
    true,
    3
  )
on conflict (id) do nothing;
