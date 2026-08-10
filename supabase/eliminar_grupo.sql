-- Permite que el creador de un grupo lo elimine (además de poder salir).
-- Asume que RLS ya está habilitado en "grupo" y "grupos_usuarios" (así
-- funciona hoy "Salir del grupo", que borra la fila propia de
-- grupos_usuarios). notificacion.id_grupo ya tiene "on delete cascade"
-- (ver notificaciones.sql), así que solo faltan estas dos políticas de delete.

drop policy if exists "el creador elimina su grupo" on grupo;
create policy "el creador elimina su grupo"
  on grupo for delete
  using (auth.uid() = id_creador);

drop policy if exists "el creador elimina los participantes de su grupo" on grupos_usuarios;
create policy "el creador elimina los participantes de su grupo"
  on grupos_usuarios for delete
  using (
    exists (
      select 1 from grupo
      where grupo.id_grupo = grupos_usuarios.id_grupo
        and grupo.id_creador = auth.uid()
    )
  );
