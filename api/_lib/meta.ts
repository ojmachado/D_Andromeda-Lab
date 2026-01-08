const GRAPH_API = 'https://graph.facebook.com/v19.0';

export async function getLongLivedToken(shortToken: string, appId: string, appSecret: string) {
  const url = `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
  const res = await fetch(url);
  return res.json();
}

export async function getBusinesses(accessToken: string) {
  // Busca negócios onde o usuário tem permissão
  const res = await fetch(`${GRAPH_API}/me/businesses?access_token=${accessToken}&fields=id,name`);
  return res.json();
}

export async function getAdAccounts(accessToken: string, businessId?: string) {
  // Se businessId for fornecido, busca contas do business, senão busca do usuário
  const endpoint = businessId ? `${businessId}/client_ad_accounts` : `me/adaccounts`;
  const res = await fetch(`${GRAPH_API}/${endpoint}?access_token=${accessToken}&fields=id,name,currency,timezone_name`);
  return res.json();
}

export async function getInsights(accessToken: string, adAccountId: string, since: string, until: string) {
  const fields = 'spend,impressions,clicks,cpc,ctr';
  const url = `${GRAPH_API}/${adAccountId}/insights?access_token=${accessToken}&time_range={'since':'${since}','until':'${until}'}&fields=${fields}&level=campaign&time_increment=1`;
  const res = await fetch(url);
  return res.json();
}