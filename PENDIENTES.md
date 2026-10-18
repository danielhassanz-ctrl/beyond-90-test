# Pendientes de Beyond 90 (18-oct-2026)

Lo que NO depende del código y te toca a ti, por orden de importancia. Todo lo demás de las auditorías está hecho y desplegado.

## 1. Supabase: tres SQL (editor de SQL, pegar y ejecutar, en este orden)

- [ ] `supabase/migrations/20261017_protect_free_tier.sql` — cierra dos agujeros de dinero: el cupo de fotos gratis (se podía crear `free_tier_eligible = yes` desde el navegador) y los contadores de IA (`ai_used`, `ai_used_sl`, que se podían reiniciar a 0).
- [ ] `supabase/migrations/20261017_account_photo_usage.sql` — las fotos gratis pasan a ser por CUENTA: borrar y recrear el personaje ya no da otras 5.
- [ ] `supabase/migrations/20261017_push_subscriptions.sql` — necesario para los avisos push (sin ella, «Activar avisos» da un error amable).

El código ya está desplegado, pero sin estos tres los agujeros del primero y del segundo siguen abiertos.

## 2. Comprobaciones en paneles que solo puedes abrir tú

- [ ] **Supabase → Authentication:** «Confirm email» activado (el panel `/admin` y la exención de fotos del dueño dependen del email y solo son seguros con el correo verificado).
- [ ] **Stripe → Webhooks:** el endpoint escucha también `charge.refunded`, `charge.dispute.created` y `checkout.session.async_payment_succeeded`.
- [ ] **Vercel:** ya están `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `CRON_SECRET` en producción. Si cambias de proyecto, hay que volver a ponerlas.
- [ ] **Lovable:** mira en Settings → Billing a qué proyecto pertenece el cargo de 25 €. No es de este proyecto (no hay ninguna referencia a Lovable en el código ni en los commits).

## 3. Decisiones tuyas

- [ ] **Coste de IA por jugador tras la beta.** Hoy: tope ~0,5 US$/jugador y solo se gasta en fotos. Decidir si se mantiene, se sube o se cobra más. Con el SQL 1 el tope ya no se puede saltar.
- [ ] **Fotos de chicas:** sigue vigente no generar más.

## 4. Legal (lo dejaste para el final)

- [ ] Política de privacidad, términos y aviso de cookies, revisados por alguien que sepa de RGPD (hay carpeta `src/app/legal`, no se ha revisado su contenido).
- [ ] Borrado de cuenta: hoy se borran los datos y las fotos del personaje, no la cuenta de acceso (`auth.users`). Exige la clave de administrador de Supabase.
- [ ] Nombres reales: el juego usa nombres de clubes, marcas (Adidas, Nike…) y selecciones. No usa escudos ni logos. Conviene que un abogado confirme que el uso es aceptable.
- [ ] Fotos de los jugadores: la persona sube su propia cara. Falta una cláusula que diga que solo puede subir una foto suya.

## 5. Probar jugando (lo que no se puede ver desde el código)

- [ ] Regenerar el hito «Penaltis en Múnich»: la camiseta tiene que ser la blanca del Madrid, sin «MADRID» escrito.
- [ ] Un partido con la selección: camiseta roja de España (primera) o blanca con escudo de la federación (segunda), no la del Madrid.
- [ ] Una final con gol en la jugada decisiva: la crónica o la tanda no deben decir 0-0.
- [ ] En mayo, la Liga llega a la jornada 38 aunque la Copa y la Champions estén vivas; la Copa y la Champions ganadas muestran «Campeón».
- [ ] Legado: pestañas Camino, Logros y Momentos (ya no existe la pantalla de Logros aparte).
- [ ] En el iPhone: añadir la app a la pantalla de inicio y activar los avisos (en iOS solo funcionan así).
- [ ] La presentación de la camiseta nueva (club en pretemporada, selección el verano antes de un Mundial/Eurocopa).
- [ ] Vestuario (`/mi-jugador/vestuario`), Prensa y redes (`/mi-jugador/prensa`) y Reto del día (`/mi-jugador/reto`).

## 6. Cosas menores que quedan en el código (no urgentes)

- `consumeImageCredit` en `src/lib/images/credits.ts` ya no se usa (la reserva atómica lo sustituye).
- Al borrar el personaje no se borra la tarjeta pública de comparar carrera (`public_career_cards`) si la tabla no tiene `on delete cascade`.
- La escena guardada en cada hito (`image_scene`) la puede escribir el propio jugador desde el navegador: ahora se acota y se filtran contenidos prohibidos, pero no se ha impedido del todo la suplantación con foto ajena sin guardar la escena firmada en el servidor.
