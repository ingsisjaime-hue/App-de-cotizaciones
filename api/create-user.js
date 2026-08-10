// Server-only endpoint: creates a new Supabase Auth user + profile row.
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as Vercel environment
// variables. The service role key must NEVER be sent to the browser.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    res.status(500).json({ error: 'Servidor mal configurado: faltan variables de entorno de Supabase.' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const callerToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!callerToken) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  try {
    // 1. Identify the caller from their access token.
    const whoResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${callerToken}` }
    });
    if (!whoResp.ok) {
      res.status(401).json({ error: 'Sesión inválida.' });
      return;
    }
    const callerUser = await whoResp.json();

    // 2. Verify the caller has permission to manage users (bypassing RLS with the service key).
    const permResp = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUser.id}&select=active,roles(permissions)`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const permRows = await permResp.json();
    const callerProfile = Array.isArray(permRows) ? permRows[0] : null;
    const canEditUsers = !!(
      callerProfile &&
      callerProfile.active &&
      callerProfile.roles &&
      callerProfile.roles.permissions &&
      callerProfile.roles.permissions.users &&
      callerProfile.roles.permissions.users.edit
    );
    if (!canEditUsers) {
      res.status(403).json({ error: 'No tienes permiso para crear usuarios.' });
      return;
    }

    // 3. Parse and validate the request body.
    const body = req.body || {};
    const username = (body.username || '').trim();
    const email = (body.email || '').trim();
    const fullName = (body.full_name || '').trim();
    const roleId = body.role_id;
    if (!username || !email || !roleId) {
      res.status(400).json({ error: 'Falta usuario, correo o rol.' });
      return;
    }

    // 4. Generate a temporary password.
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let tempPassword = '';
    for (let i = 0; i < 14; i++) {
      tempPassword += chars[Math.floor(Math.random() * chars.length)];
    }

    // 5. Create the Auth user.
    const createResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: tempPassword, email_confirm: true })
    });
    const created = await createResp.json();
    if (!createResp.ok) {
      res.status(400).json({ error: created.msg || created.message || 'No se pudo crear el usuario.' });
      return;
    }

    // 6. Insert the profile row linking the new user to a role.
    const profResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ id: created.id, username, email, full_name: fullName, role_id: roleId, active: true })
    });
    if (!profResp.ok) {
      const errText = await profResp.text();
      // Roll back the auth user so a failed creation doesn't leave an orphaned account.
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${created.id}`, {
        method: 'DELETE',
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
      }).catch(() => {});
      const friendly = /duplicate|unique/i.test(errText) ? 'Ese nombre de usuario ya está en uso.' : errText;
      res.status(400).json({ error: friendly });
      return;
    }

    res.status(200).json({ username, email, tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error inesperado.' });
  }
};
