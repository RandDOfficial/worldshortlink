// HTML dosyalarını import et
import indexHtml from './index.html';
import notFoundHtml from './404.html';

// Turkish to English character conversion map
const turkishToEnglish = {
  'ç': 'c', 'Ç': 'C',
  'ğ': 'g', 'Ğ': 'G',
  'ı': 'i', 'I': 'I',
  'ö': 'o', 'Ö': 'O',
  'ş': 's', 'Ş': 'S',
  'ü': 'u', 'Ü': 'U'
};

function convertTurkishToEnglish(text) {
  return text.replace(/[çÇğĞıIöÖşŞüÜ]/g, char => turkishToEnglish[char] || char);
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Serve main page
    if (req.method === 'GET' && path === '/') {
      return new Response(indexHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Handle form submission
    if (req.method === 'POST' && path === '/') {
      try {
        const formData = await req.formData();
        let id = formData.get('id')?.toString().trim();
        const domain = formData.get('domain')?.toString().trim();

        if (!id || !domain) {
          return new Response("❌ Eksik bilgi girdiniz!", { 
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }

        // Validate URL
        if (!isValidUrl(domain)) {
          return new Response("❌ Geçersiz URL formatı! https:// ile başlayan tam URL girin.", { 
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }

        // Convert Turkish characters to English
        const originalId = id;
        id = convertTurkishToEnglish(id);
        
        // Clean up ID (remove special characters, spaces, etc.)
        id = id.toLowerCase()
                .replace(/[^a-z0-9\-_]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

        if (id.length < 1) {
          return new Response("❌ Geçersiz ID! En az 1 karakter olmalı.", { 
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }

        // Check if ID already exists
        const existing = await env.LINKS.get(id);
        if (existing) {
          return new Response(`⚠️ Bu ID zaten kullanılıyor! "${id}" başka bir URL'e yönlendiriyor.`, {
            status: 409,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }

        // Save the link
        await env.LINKS.put(id, domain);
        
        let responseMessage = `🎉 Başarıyla oluşturuldu! <strong>${id}</strong> → ${domain}`;
        
        if (originalId !== id) {
          responseMessage += `<br><small>💡 Türkçe karakterler İngilizceye çevrildi: "${originalId}" → "${id}"</small>`;
        }

        return new Response(responseMessage, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });

      } catch (error) {
        return new Response("❌ Sunucu hatası oluştu!", { 
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }

    // Handle redirect requests
    const id = path.slice(1);
    if (id) {
      const target = await env.LINKS.get(id);
      if (target) {
        return Response.redirect(target, 302);
      }
    }

    // 404 page
    return new Response(notFoundHtml, { 
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}
