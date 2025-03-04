-- Add group_id to threads table
ALTER TABLE threads
ADD COLUMN group_id UUID REFERENCES persona_groups(id) ON DELETE CASCADE;

-- Update messages table to support persona names as senders
ALTER TABLE messages
DROP CONSTRAINT messages_sender_check;

ALTER TABLE messages
ADD CONSTRAINT messages_sender_check
CHECK (sender IS NOT NULL); 