SELECT
    pol.polname AS policy_name,
    tab.relname AS table_name,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression,
    pol.polcmd AS command
FROM pg_policy pol
JOIN pg_class tab ON tab.oid = pol.polrelid
JOIN pg_namespace ns ON ns.oid = tab.relnamespace
WHERE ns.nspname = 'storage'
ORDER BY tab.relname, pol.polname;