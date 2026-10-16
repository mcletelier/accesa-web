# accesa.agency

Sitio de Accesa construido con [Astro](https://astro.build) y publicado en Cloudflare Pages.
Los artículos del blog se editan con [Pages CMS](https://app.pagescms.org).

## Estructura

```
src/
  pages/                 Páginas del sitio (cada archivo = una URL)
    index.astro          Portada en español  → /
    en/index.astro       Portada en inglés   → /en/
    accesibilidad/       Declaración de accesibilidad (ES)
    en/accessibility/    Declaración de accesibilidad (EN)
    blog/                Índice, artículos y etiquetas del blog
    sitemap.xml.ts       Sitemap (se regenera solo con cada publicación)
    rss.xml.js           Feed RSS del blog
  content/blog/          Artículos del blog (archivos .md)
  layouts/Base.astro     <head> común: favicons, fuentes, SEO, hreflang
  components/            Encabezado, pie y tarjetas del blog
  styles/                CSS de cada sección
public/                  Archivos que se copian tal cual (favicons, robots.txt, imágenes)
.pages.yml               Configuración del editor visual
```

## Publicar un artículo

1. Entra a https://app.pagescms.org con tu cuenta de GitHub y abre este repositorio.
2. Ve a **Blog → Add an entry**, completa los campos y escribe el contenido.
3. Desmarca **Borrador** y guarda. Cloudflare publica el cambio en uno o dos minutos.

Reglas que valida el sitio al publicar:
- Si agregas imagen destacada, el **texto alternativo** es obligatorio. Si falta, la publicación falla y el sitio sigue mostrando la versión anterior.
- Dentro del contenido usa **Título 2** y **Título 3**; el título del artículo ya es el Título 1.

## Configuración de Cloudflare Pages

- Framework preset: **Astro**
- Comando de build: `npm run build`
- Directorio de salida: `dist`
- Variable de entorno: `NODE_VERSION` = `22.12.0`

## Trabajar en local (opcional)

```
npm install
npm run dev      # vista previa en http://localhost:4321
npm run build    # genera el sitio en dist/
```
