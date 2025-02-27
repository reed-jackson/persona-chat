-- Create workplace_context table
create table public.workplace_context (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    company_name text not null,
    product_name text not null,
    description text not null,
    industry text not null,
    target_audience text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (user_id)
);

-- Enable RLS
alter table public.workplace_context enable row level security;

-- Create policies
create policy "Users can view their own workplace context"
    on public.workplace_context for select
    using (auth.uid() = user_id);

create policy "Users can insert their own workplace context"
    on public.workplace_context for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own workplace context"
    on public.workplace_context for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own workplace context"
    on public.workplace_context for delete
    using (auth.uid() = user_id);

-- Create updated_at trigger
create trigger handle_updated_at before update on public.workplace_context
    for each row execute procedure moddatetime (updated_at); 