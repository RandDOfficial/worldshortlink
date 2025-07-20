export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === 'GET' && path === '/') {
      return new Response(`
        <form method="POST">
          <input name="id" placeholder="Kısa ID (örn: abc123)" required />
          <input name="domain" placeholder="Hedef URL (https://...)" required />
          <button type="submit">Kaydet</button>
        </form>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (req.method === 'POST' && path === '/') {
      const formData = await req.formData();
      const id = formData.get('id');
      const domain = formData.get('domain');

      if (!id || !domain) {
        return new Response("Eksik bilgi", { status: 400 });
      }

      await env.LINKS.put(id, domain);
      return new Response(`Kayıt edildi: ${id} → ${domain}`);
    }

    const id = path.slice(1);
    const target = await env.LINKS.get(id);
    if (target) {
      return Response.redirect(target, 302);
    }

    return new Response("Bulamadım", { status: 404 });
  }
}
