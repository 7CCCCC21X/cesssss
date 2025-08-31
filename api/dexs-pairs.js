export default async function handler(req, res) {
  try {
    const chain = (req.query.chain || 'bsc').toLowerCase();
    const pairs = String(req.query.pairs || '').split(',').map(s=>s.trim()).filter(Boolean);
    if (!pairs.length) return res.status(400).json({ ok:false, error:'pairs required' });

    // DexScreener 单对查询；这里并发抓并抽取关键字段
    const jobs = pairs.slice(0, 50).map(async (p) => {
      const u = `https://api.dexscreener.com/latest/dex/pairs/${chain}/${p}`;
      const r = await fetch(u);
      const j = await r.json();
      const o = j?.pairs?.[0];
      if (!o) return null;
      return {
        pairAddress: o.pairAddress,
        base: o.baseToken?.symbol,
        quote: o.quoteToken?.symbol,
        liquidity: o.liquidity,         // { usd, base, quote }
        priceUsd: Number(o.priceUsd),
        pairCreatedAt: o.pairCreatedAt
      };
    });
    const data = (await Promise.all(jobs)).filter(Boolean);
    res.json({ ok:true, data });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
}
