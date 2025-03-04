-- Create persona_groups table
CREATE TABLE IF NOT EXISTS persona_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create persona_group_members junction table
CREATE TABLE IF NOT EXISTS persona_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES persona_groups(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, persona_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE persona_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for persona_groups
CREATE POLICY "Users can view their own persona groups"
    ON persona_groups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own persona groups"
    ON persona_groups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persona groups"
    ON persona_groups FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persona groups"
    ON persona_groups FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for persona_group_members
CREATE POLICY "Users can view their own persona group members"
    ON persona_group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM persona_groups
            WHERE persona_groups.id = persona_group_members.group_id
            AND persona_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert into their own persona group members"
    ON persona_group_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM persona_groups
            WHERE persona_groups.id = group_id
            AND persona_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete from their own persona group members"
    ON persona_group_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM persona_groups
            WHERE persona_groups.id = group_id
            AND persona_groups.user_id = auth.uid()
        )
    );

-- Create updated_at trigger for persona_groups
CREATE TRIGGER update_persona_groups_updated_at
    BEFORE UPDATE ON persona_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 