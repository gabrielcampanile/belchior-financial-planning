REVOKE ALL ON FUNCTION public.duplicate_scenario(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.duplicate_scenario(UUID, TEXT) TO authenticated;