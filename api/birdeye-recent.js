export default async function handler(req, res) {
  try {
    const chain = (req.query.chain || 'bsc').toLowerCase();
    const minUsd = Number(req.query.minUsd || 500000);
    const key = process.env.BIRDEYE_API_KEY; // 在 Vercel 环境变量里设置
    if (!key) return res.status(500).json({ ok:false, error:'BIRDEYE_API_KEY missing' });

    // Recent trades feed（包含交易/交换/流动性事件；跨链）
    // 具体分页/limit参数以文档为准，这里做一个实用示例
    const url = `https://public-api.birdeye.so/defi/v3/txs/recent?x-chain=${chain}&limit=200`;
    const r = await fetch(url, { headers: { 'X-API-KEY': key } });
    const j = await r.json();

    // 只保留“加流”并按金额过滤；字段名在不同链/DEX可能略有差异，常见为 type/txType + volumeUSD
    const rows = (j?.data || j?.txs || []).filter(x => {
      const t = (x.type || x.txType || '').toLowerCase();
      const usd = Number(x.volumeUSD ?? x.volume_usd ?? x.usdValue ?? 0);
      return (t.includes('add_liquidity') || t.includes('mint')) && usd >= minUsd;
    }).map(x => ({
      chain,
      type: x.type || x.txType,
      pair: x.pairAddress || x.marketAddress || x.poolAddress,
      token0: x.token0 || x.base || x.baseMint,
      token1: x.token1 || x.quote || x.quoteMint,
      amount0: x.amount0 || x.baseAmount,
      amount1: x.amount1 || x.quoteAmount,
      volumeUSD: Number(x.volumeUSD ?? x.volume_usd ?? x.usdValue ?? 0),
      txHash: x.txHash || x.signature,
      blockTime: x.blockUnixTime || x.block_time
    }));

    res.json({ ok:true, rows });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
}
