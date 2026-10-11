-- Creates a secure RPC function to accept friend requests, bypassing any RLS issues
CREATE OR REPLACE FUNCTION public.accept_friend_request(p_friendship_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Verify the caller is the addressee and the request is pending
  IF NOT EXISTS (
    SELECT 1 FROM public.friends 
    WHERE id = p_friendship_id 
      AND addressee_id = auth.uid()
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Not authorized to accept this friend request or it does not exist.';
  END IF;

  -- Perform the update
  UPDATE public.friends 
  SET status = 'accepted' 
  WHERE id = p_friendship_id;
  
  RETURN TRUE;
END;
$$;
