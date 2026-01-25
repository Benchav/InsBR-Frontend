// Script para validar manifest, service worker e iconos de una PWA
// Ejecuta esto en la consola del navegador en tu sitio o como archivo JS en Node.js con pequeñas adaptaciones

(async function validatePWA() {
  // 1. Verificar manifest
  try {
    const manifestUrl = '/manifest.webmanifest';
    const manifestResp = await fetch(manifestUrl);
    if (!manifestResp.ok) {
      console.error('❌ Manifest no encontrado o inaccesible:', manifestUrl);
      return;
    }
    const manifest = await manifestResp.json();
    console.log('✅ Manifest encontrado:', manifestUrl);
    // Campos requeridos
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        console.error(`❌ Falta el campo '${field}' en el manifest.`);
      } else {
        console.log(`✅ Campo '${field}' presente.`);
      }
    }
    // Iconos requeridos
    const iconSizes = ["192x192", "512x512"];
    for (const size of iconSizes) {
      const icon = manifest.icons.find((i) => i.sizes === size);
      if (!icon) {
        console.error(`❌ Falta icono de tamaño ${size} en el manifest.`);
      } else {
        // Probar acceso al icono
        const iconResp = await fetch(icon.src);
        if (!iconResp.ok) {
          console.error(`❌ Icono ${icon.src} (${size}) no accesible.`);
        } else {
          console.log(`✅ Icono ${icon.src} (${size}) accesible.`);
        }
      }
    }
  } catch (e) {
    console.error('❌ Error al validar el manifest:', e);
  }

  // 2. Verificar Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        console.error('❌ No hay Service Worker registrado.');
      } else {
        console.log('✅ Service Worker registrado:', registrations.map(r => r.active && r.active.scriptURL));
      }
    } catch (e) {
      console.error('❌ Error al verificar Service Worker:', e);
    }
  } else {
    console.error('❌ Service Worker no soportado en este navegador.');
  }

  // 3. Verificar HTTPS
  if (location.protocol !== 'https:') {
    console.error('❌ La PWA debe servirse por HTTPS.');
  } else {
    console.log('✅ Sitio servido por HTTPS.');
  }
})();
