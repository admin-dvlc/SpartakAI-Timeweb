// api/timeweb-chat/index.js
module.exports = async function (context, req) {
  const fetch = global.fetch || (await import("node-fetch")).default;

  const agentId = process.env.TIMEWEB_AGENT_ID;
  const apiKey  = process.env.TIMEWEB_API_KEY;

  if (!agentId || !apiKey) {
    context.res = {
      status: 500,
      body: { error: "TIMEWEB_AGENT_ID or TIMEWEB_API_KEY is not configured" }
    };
    return;
  }

  const baseUrl = "https://agent.timeweb.cloud";
  const url = `${baseUrl}/api/v1/cloud-ai/agents/${agentId}/v1/chat/completions`;

  try {
    const body = req.body || {};
    const messages = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      context.res = {
        status: 400,
        body: { error: "messages array is required" }
      };
      return;
    }

    const twResp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-proxy-source": "teams-tab-swa"
      },
      body: JSON.stringify({
        messages,
        stream: false
      })
    });

    const text = await twResp.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!twResp.ok) {
      context.res = {
        status: twResp.status,
        body: { error: "Timeweb error", status: twResp.status, data }
      };
      return;
    }

    context.res = {
      status: 200,
      body: data
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: { error: "Proxy error", message: err && err.message ? err.message : String(err) }
    };
  }
};