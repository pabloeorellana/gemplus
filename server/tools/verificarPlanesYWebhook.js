// verificarPlanesYWebhook.js
import pkg from "mercadopago";
import fetch from "node-fetch";

const { MercadoPagoConfig, PreApprovalPlan } = pkg;

// ⚙️ 1. Configurar el token actual de tu backend (.env)
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || "APP_USR-2959571445821358-100709-e7d7183fb04449e8323c89b9b816e840-2908928777";

// ✅ 2. Crear cliente Mercado Pago
const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });

async function verificar() {
  try {
    console.log("🔍 Verificando cuenta con Access Token:", ACCESS_TOKEN.substring(0, 15) + "...");

    // 🧩 1. Listar planes (preapproval_plan_id)
    const planApi = new PreApprovalPlan(client);
    const planes = await planApi.search({ limit: 10 });
    if (!planes.results.length) {
      console.log("⚠️ No se encontraron planes en esta cuenta. Puede que uses otro token.");
    } else {
      console.log("\n📋 Planes encontrados:");
      planes.results.forEach((p) => {
        console.log(`- ${p.reason} | ID: ${p.id} | Estado: ${p.status}`);
      });
    }

    // 🧩 2. Verificar configuración actual del webhook
    console.log("\n🌐 Verificando URL de notificación (webhook)...");
    const resp = await fetch("https://api.mercadopago.com/user/me", {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    const data = await resp.json();
    console.log("\n👤 Cuenta:", data.nickname || data.email || "(sin nombre)");
    console.log("Webhook registrado:", data.notification_url || "❌ Ninguno configurado");

    console.log("\n✅ Listo. Si los planes no aparecen o el webhook es distinto al de ngrok, ahí está el problema.");
  } catch (error) {
    console.error("❌ Error al verificar:", error.message);
  }
}

verificar();
