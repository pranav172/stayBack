-- Allow users to DELETE their own chats
-- (Required for the cleanup API to work)

DROP POLICY IF EXISTS "Delete own chats" ON public.chats;

CREATE POLICY "Delete own chats"
ON public.chats
FOR DELETE
USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Also ensure messages can be deleted when parent chat is deleted
-- (Cascade should handle this, but let's add policy for explicit delete)
DROP POLICY IF EXISTS "Delete chat messages" ON public.messages;

CREATE POLICY "Delete chat messages"
ON public.messages
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.chats c
        WHERE c.id = messages.chat_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
);
