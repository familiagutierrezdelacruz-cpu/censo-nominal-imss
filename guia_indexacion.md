# Guía de Indexación en Google

Para que tu aplicación aparezca en los resultados de búsqueda de Google, debe cumplir con ciertos requisitos y seguir estos pasos:

## 1. Despliegue Público
Google solo puede indexar sitios que están disponibles en internet de forma pública. Actualmente, si accedes a través de `localhost`, Google no tiene forma de verlo.
- Puedes desplegar tu app en servicios como **Vercel**, **Netlify** o un servidor propio.

## 2. Google Search Console
Una vez que tu app esté publicada bajo un dominio (ejemplo: `https://mi-censo-materno.com`):
1. Ve a [Google Search Console](https://search.google.com/search-console/about).
2. Añade tu sitio como una nueva "Propiedad".
3. Verifica la propiedad siguiendo las instrucciones (usualmente añadiendo un archivo HTML o un registro DNS).

## 3. Solicitar Indexación
Dentro de Search Console:
1. Usa la herramienta de **Inspección de URLs**.
2. Ingresa la URL de tu sitio.
3. Haz clic en **"Solicitar indexación"**.

## 4. Crear un Sitemap
Un archivo `sitemap.xml` ayuda a Google a encontrar todas tus páginas.
- Para aplicaciones de una sola página (SPA) como esta, basta con la URL principal.

## Notas Importantes
- **Tiempo**: Google puede tardar desde unos días hasta un par de semanas en indexar un sitio nuevo.
- **Contenido**: Google prioriza sitios con contenido de valor y buena estructura técnica (esto ya lo mejoramos con los nuevos metadatos).
