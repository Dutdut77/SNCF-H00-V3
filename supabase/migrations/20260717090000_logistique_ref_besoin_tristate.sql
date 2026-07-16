-- Passage du besoin imprimante / réseau au tri-état (null = à définir, true = besoin, false = aucun besoin),
-- comme la base vie et la radio.
--
-- L'ancienne UI (switch on/off) sérialisait systématiquement besoin=false pour tout chantier
-- dont la logistique avait été enregistrée, sans qu'une décision « aucun besoin » ait été prise.
-- On remet donc ces false à null pour que ces chantiers repassent en « À définir »
-- et qu'une vraie décision soit saisie. Les besoin=true (matériel demandé) sont conservés.

update public.chantier_logistique
set equipements = jsonb_set(equipements, '{imprimante,besoin}', 'null'::jsonb)
where equipements -> 'imprimante' ->> 'besoin' = 'false';

update public.chantier_logistique
set equipements = jsonb_set(equipements, '{wifi,besoin}', 'null'::jsonb)
where equipements -> 'wifi' ->> 'besoin' = 'false';
