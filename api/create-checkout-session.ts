import Stripe from "stripe";
import crypto from "crypto";

export default async function handler(req: any, res: any) {
  // Allow OPTIONS method for preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Permitido apenas requisições POST ou GET" });
  }

  try {
    const rawOrigin = process.env.APP_URL || req.headers.origin || req.headers.referer || "http://localhost:3000";
    let origin = "http://localhost:3000";
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

    const generatedToken = "pro_" + crypto.randomBytes(16).toString("hex");

    // Creating Stripe session
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
            unit_amount: 999, // R$ 9.99
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/cadastro?token=${generatedToken}`,
      cancel_url: `${origin}/`,
      metadata: {
        token: generatedToken
      }
    });

    // Send access headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("Erro ao criar sessão de checkout no servidor Vercel:", err);
    return res.status(500).json({ error: err.message || "Erro interno no servidor" });
  }
}
