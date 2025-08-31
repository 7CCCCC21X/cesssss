export default async function handler(req, res) {
  try {
    const network = (req.query.network || 'bsc').toLowerCase();
    const page = req.query.page || '1';
    const key = process.env.CG_API_KEY; // 在 Vercel 环境变量里设置
    if (!key) return res.status(500).json({ ok:false, error:'CG_API_KEY missing' });

    const url = `https://pro-api.coingecko.com/api/v3/onchain/networks/${network}/new_pools?page=${page}`;
    const r = await fetch(url, { headers: { 'x-cg-pro-api-key': key } });
    const j = await r.json();
    // 统一结构（只挑常用字段）
    const items = (j?.data || []).map(p => ({
      network,
      pool_address: p?.attributes?.address,
      dex: p?.attributes?.dex?.name,
      base: p?.relationships?.base_token?.data?.id,
      quote: p?.relationships?.quote_token?.data?.id,
      created_at: p?.attributes?.pool_created_at
    }));
    res.json({ ok:true, items });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
}
