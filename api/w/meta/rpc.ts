import { kv, KEYS } from '../../_lib/kv';
import { getUser, errorResponse } from '../../_lib/auth';
import { decrypt, encrypt } from '../../_lib/crypto';
import { getBusinesses, getAdAccounts, getInsights } from '../../_lib/meta';

export default async function handler(req: Request) {
  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorized', 'Login requerido');

  const url = new URL(req.url);
  const action = url.searchParams.get('action'); // businesses, adaccounts, insights
  const workspaceId = url.searchParams.get('workspaceId');

  if (!workspaceId) return errorResponse(400, 'missing_id', 'Workspace ID required');

  const ws = await kv.get<any>(KEYS.WORKSPACE(workspaceId));
  if (!ws || ws.ownerId !== user.userId) return errorResponse(403, 'forbidden', 'Access denied');

  // Recupera Access Token
  if (!ws.meta?.accessToken) return errorResponse(400, 'not_connected', 'Meta not connected');
  const accessToken = decrypt(ws.meta.accessToken);

  try {
    if (req.method === 'GET') {
      if (action === 'businesses') {
        const data = await getBusinesses(accessToken);
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
      }

      if (action === 'adaccounts') {
        const businessId = url.searchParams.get('businessId');
        const data = await getAdAccounts(accessToken, businessId || undefined);
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
      }

      if (action === 'insights') {
        const adAccountId = url.searchParams.get('adAccountId') || ws.meta.adAccountId;
        const since = url.searchParams.get('since');
        const until = url.searchParams.get('until');
        if (!adAccountId) return errorResponse(400, 'missing_account', 'Ad Account ID required');
        
        const data = await getInsights(accessToken, adAccountId, since!, until!);
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (req.method === 'POST' && action === 'select') {
      const body = await req.json();
      // Salva configuração escolhida
      ws.meta = {
        ...ws.meta,
        status: 'configured',
        businessId: body.businessId,
        adAccountId: body.adAccountId,
        currency: body.currency,
        timezone: body.timezone
      };
      await kv.set(KEYS.WORKSPACE(workspaceId), ws);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

  } catch (err: any) {
    return errorResponse(500, 'meta_api_error', err.message);
  }

  return errorResponse(404, 'not_found', 'Endpoint not found');
}