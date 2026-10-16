/**
 * Cloudflare Pages Function: recibe el formulario de contacto y lo envía por correo con Resend.
 * URL: POST /api/contacto
 *
 * Variables de entorno (Cloudflare Pages → Settings → Variables and secrets):
 *   RESEND_API_KEY  (secreto)  Clave de API de Resend
 *   CONTACT_TO                 Correo donde llegan los mensajes
 *   CONTACT_FROM    (opcional) Remitente. Por defecto "Accesa <onboarding@resend.dev>",
 *                              que solo puede enviar al correo de tu cuenta de Resend.
 *                              Cuando verifiques accesa.agency en Resend, usa por ejemplo
 *                              "Accesa <web@accesa.agency>".
 */

const MSG = {
  es: {
    nombre: 'Escribe tu nombre.',
    email: 'Revisa el email: debe tener un formato como nombre@dominio.cl.',
    mensaje: 'Cuéntanos brevemente qué necesitas.',
  },
  en: {
    nombre: 'Enter your name.',
    email: 'Check the email: it should look like name@domain.com.',
    mensaje: 'Tell us briefly what you need.',
  },
};
const PAGES = {
  es: { ok: '/gracias/', error: '/error-envio/' },
  en: { ok: '/en/thanks/', error: '/en/send-error/' },
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (v, max) => String(v ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max);
const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function reply(request, lang, result, status = 200) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify(result), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  // Sin JavaScript: redirige a la página de confirmación o de error
  const target = new URL(result.ok ? PAGES[lang].ok : PAGES[lang].error, request.url);
  return Response.redirect(target.toString(), 303);
}

export async function onRequestPost({ request, env }) {
  // Solo se aceptan envíos desde el propio sitio
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return new Response('Forbidden', { status: 403 });
  }

  let data = {};
  try {
    const type = request.headers.get('content-type') || '';
    data = type.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return reply(request, 'es', { ok: false }, 400);
  }

  const lang = data.lang === 'en' ? 'en' : 'es';

  // Trampa para robots: si el campo oculto viene lleno, se responde como si todo saliera bien
  if (clean(data.sitio_web, 200)) return reply(request, lang, { ok: true });

  const f = {
    nombre: clean(data.nombre, 120),
    organizacion: clean(data.organizacion, 160),
    email: clean(data.email, 200),
    servicio: clean(data.servicio, 120),
    mensaje: clean(data.mensaje, 5000),
  };

  const errors = {};
  if (!f.nombre) errors.nombre = MSG[lang].nombre;
  if (!EMAIL.test(f.email)) errors.email = MSG[lang].email;
  if (!f.mensaje) errors.mensaje = MSG[lang].mensaje;
  if (Object.keys(errors).length) return reply(request, lang, { ok: false, errors }, 422);

  if (!env.RESEND_API_KEY || !env.CONTACT_TO) {
    console.error('Faltan las variables RESEND_API_KEY o CONTACT_TO');
    return reply(request, lang, { ok: false }, 500);
  }

  const rows = [
    ['Nombre', f.nombre],
    ['Organización', f.organizacion || '—'],
    ['Email', f.email],
    ['Servicio', f.servicio || '—'],
    ['Idioma del sitio', lang === 'en' ? 'Inglés' : 'Español'],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nMensaje:\n${f.mensaje}\n`;
  const html =
    `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">` +
    rows.map(([k, v]) => `<tr><th align="left" style="color:#555">${k}</th><td>${escapeHtml(v)}</td></tr>`).join('') +
    `</table><h3 style="font-family:Arial,sans-serif">Mensaje</h3>` +
    `<p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(f.mensaje)}</p>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'Accesa <onboarding@resend.dev>',
        to: env.CONTACT_TO.split(',').map((s) => s.trim()),
        reply_to: f.email,
        subject: `Contacto web: ${f.nombre}${f.organizacion ? ` (${f.organizacion})` : ''}`,
        text,
        html,
      }),
    });
    if (!res.ok) {
      console.error('Resend respondió', res.status, await res.text());
      return reply(request, lang, { ok: false }, 502);
    }
  } catch (err) {
    console.error('Error al llamar a Resend', err);
    return reply(request, lang, { ok: false }, 502);
  }

  return reply(request, lang, { ok: true });
}

export function onRequest() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
