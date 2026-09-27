export const PLAN_LIMITS = {
  FREE: {
    maxPrinters: 1,
    maxProducts: 3,
    maxFilaments: 5,
    allowedChannels: ['custo_real'], // Apenas o Custo Real no plano grátis
  },
  PRO: {
    maxPrinters: Infinity,
    maxProducts: Infinity,
    maxFilaments: Infinity,
    allowedChannels: ['*'], // Liberta Mercado Livre, TikTok, Shopee, etc.
  },
};