import Stripe from "stripe";
import crypto from "crypto";

export default async function handler(req: any, res: any) {
  // Configuração segura de CORS para o ambiente Serverless da Vercel
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Permite a requisição de pré-vôo (preflight) do navegador
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Permitido apenas requisições POST ou GET" });
  }

  try {
    // Captura a origem exata do seu site atual na Vercel de forma dinâmica
    const rawOrigin = process.env.APP_URL || req.headers.origin || req.headers.referer || "https://financaspro.com";
    let origin = "https://financaspro.com";
    
    try {
      const parsedUrl = new URL(Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin);
      origin = `${parsedUrl.protocol}//${parsedUrl.host}`;
    } catch {
      origin = (Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin).trim().replace(/\/$/, "");
      if (origin.includes("://")) {
        const parts = origin.split("/");
        origin = `${parts[0]}//${parts[2]}`;
      }
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: "Erro de Configuração: A chave STRIPE_SECRET_KEY não foi encontrada nas variáveis de ambiente do servidor." });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16" as any
    });

    // Mantida a sua lógica perfeita de geração de token seguro
    const generatedToken = "pro_" + crypto.randomBytes(16).toString("hex");

    // Criação da sessão do Stripe com as propriedades corrigidas e limpas
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Acesso Premium - FinançasPro",
              description: "Garanta seu acesso exclusivo à nossa gestão financeira estratégica inovadora e inteligência analítica.",
            },
            unit_amount: 999, // R$ 9,99
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // Garante que não haverá duplicidade de barras na URL gerada
      success_url: `${origin.replace(/\/$/, "")}/cadastro?token=${generatedToken}`,
      cancel_url: `${origin.replace(/\/$/, "")}/`,
      metadata: {
        token: generatedToken
      }
    });

    // Retorna com sucesso o ID e a URL estável para o redirecionamento
    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("Erro ao criar sessão de checkout no servidor Vercel:", err);
    return res.status(500).json({ error: err.message || "Erro interno no servidor" });
  }
}