# Conciertos para cargar desde el backoffice

Fuente: [Time Out Buenos Aires: "Los recitales internacionales confirmados para 2027 en Argentina"](https://www.timeout.com/es/buenos-aires/recitales-shows-musica-que-ver), publicada el 14/10/2026.

## Antes de empezar

1. Corré [estadios_timeout.sql](estadios_timeout.sql) en el SQL Editor de Supabase. Carga Teatro Colón, Parque de la Ciudad, C Art Media y Estadio Malvinas Argentinas, que todavía no existen y el backoffice no deja crear.
2. "Estadio Monumental" en la base se llama **River Plate**.

## Datos que no venían en la nota

- **Hora:** la nota no da horarios. Puse **21:00** en todos. Corregila cuando se confirme.
- **Año:** todas las fechas son de 2027 (lo dice el título de la nota).
- **Género:** metal, electrónica y clásica se agregan con [generos_y_estadios_timeout.sql](generos_y_estadios_timeout.sql). Corrélo antes de cargar Einaudi, Epica y ULTRA.
- **Artista:** elegilo de la lista de Spotify del formulario, así se avisa a sus seguidores. ULTRA es un festival y no va a aparecer: escribilo a mano.

## Conciertos (24 cargas)

Los campos están en el orden del formulario. Einaudi tiene 2 fechas en lugares distintos, La Oreja de Van Gogh 3 fechas y ULTRA 2 días. Cada fecha se carga como un concierto aparte.

| # | Nombre | Artista | Estadio | Género | Fecha y hora | Imagen |
|---|---|---|---|---|---|---|
| 1 | Fifty Something | Rush | Movistar Arena | rock | 15/01/2027 21:00 | https://media.timeout.com/images/106457247/750/422/image.jpg |
| 2 | Viajando Por El Mundo Tropitour | Karol G | River Plate | urbano | 05/02/2027 21:00 | https://media.timeout.com/images/106457249/750/422/image.jpg |
| 3 | Surfilmusic Tour | Jack Johnson | Movistar Arena | singer-songwriter | 05/02/2027 21:00 | https://media.timeout.com/images/106457250/750/422/image.jpg |
| 4 | Reik en el Movistar Arena | Reik | Movistar Arena | pop | 14/02/2027 21:00 | https://media.timeout.com/images/106457251/750/422/image.jpg |
| 5 | Take Cover Tour | Foo Fighters | River Plate | rock | 25/02/2027 21:00 | https://media.timeout.com/images/106457255/750/422/image.jpg |
| 6 | Escenas Tour | Sin Bandera | Movistar Arena | pop | 27/02/2027 21:00 | https://media.timeout.com/images/106457258/750/422/image.jpg |
| 7 | Einaudi Solo Piano | Ludovico Einaudi | Teatro Colón | clásica | 01/03/2027 21:00 | https://media.timeout.com/images/106457263/750/422/image.jpg |
| 8 | Einaudi con banda | Ludovico Einaudi | Movistar Arena | clásica | 03/03/2027 21:00 | https://media.timeout.com/images/106457263/750/422/image.jpg |
| 9 | 25 aniversario (con Rhapsody) | Epica | Estadio Malvinas Argentinas | metal | 07/03/2027 21:00 | https://media.timeout.com/images/106457264/750/422/image.jpg |
| 10 | Love The 90s Argentina 2027 | Love The 90s | Movistar Arena | pop | 13/03/2027 21:00 | https://media.timeout.com/images/106457270/750/422/image.jpg |
| 11 | La calma | El Kanka | Teatro Gran Rex | singer-songwriter | 13/03/2027 21:00 | https://media.timeout.com/images/106457271/750/422/image.jpg |
| 12 | No Me Hablen De Amor | Ha*Ash | Movistar Arena | pop | 17/03/2027 21:00 | https://media.timeout.com/images/106457272/750/422/image.jpg |
| 13 | Tantas cosas que contar Tour | La Oreja de Van Gogh | Movistar Arena | pop rock | 19/03/2027 21:00 | https://media.timeout.com/images/106457275/750/422/image.jpg |
| 14 | Tantas cosas que contar Tour | La Oreja de Van Gogh | Movistar Arena | pop rock | 20/03/2027 21:00 | https://media.timeout.com/images/106457275/750/422/image.jpg |
| 15 | Tantas cosas que contar Tour | La Oreja de Van Gogh | Movistar Arena | pop rock | 21/03/2027 21:00 | https://media.timeout.com/images/106457275/750/422/image.jpg |
| 16 | World Tour 2027 | Jungle | Movistar Arena | indie | 01/04/2027 21:00 | https://media.timeout.com/images/106457278/750/422/image.jpg |
| 17 | How Did We Get Here? World Tour | Louis Tomlinson | Movistar Arena | pop rock | 02/04/2027 21:00 | https://media.timeout.com/images/106457281/750/422/image.jpg |
| 18 | ULTRA Buenos Aires (día 1) | ULTRA Buenos Aires | Parque de la Ciudad | electrónica | 02/04/2027 21:00 | https://media.timeout.com/images/106457285/750/422/image.jpg |
| 19 | ULTRA Buenos Aires (día 2) | ULTRA Buenos Aires | Parque de la Ciudad | electrónica | 03/04/2027 21:00 | https://media.timeout.com/images/106457285/750/422/image.jpg |
| 20 | Pixies en el Movistar Arena | Pixies | Movistar Arena | indie | 04/04/2027 21:00 | https://media.timeout.com/images/106457290/750/422/image.jpg |
| 21 | Camisa de Fuerza | Kase.O | Movistar Arena | hip hop | 07/05/2027 21:00 | https://media.timeout.com/images/106457291/750/422/image.jpg |
| 22 | Así Soy Yo | Cuarteto de Nos | Movistar Arena | rock | 22/05/2027 21:00 | https://media.timeout.com/images/106457292/750/422/image.jpg |
| 23 | Lives Outgrown | Beth Gibbons | C Art Media | singer-songwriter | 27/05/2027 21:00 | https://media.timeout.com/images/106457293/750/422/image.jpg |
| 24 | Una Historia Importante World Tour | Eros Ramazzotti | Movistar Arena | pop | 06/11/2027 21:00 | https://media.timeout.com/images/106457294/750/422/image.jpg |

Las imágenes son de Time Out (verificado que cargan).
