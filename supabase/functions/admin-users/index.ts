import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AdminUsersRequest = {
  action?: string;
  username?: string;
  name?: string;
  role?: string;
  password?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase admin environment is not configured." }, 500);
  }

  const authorization = req.headers.get("Authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) {
    return jsonResponse({ error: "ログイン情報が確認できません。再ログインしてください。" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: authData, error: authError } = await adminClient.auth.getUser(accessToken);
  const caller = authData?.user;
  if (authError || !caller) {
    return jsonResponse({ error: "ログイン情報が無効です。再ログインしてください。" }, 401);
  }

  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .maybeSingle();

  const isAdmin = caller.user_metadata?.role === "admin" || callerProfile?.role === "admin";
  if (!isAdmin) {
    return jsonResponse({ error: "アクセス権限がありません。管理者のみ実行可能です。" }, 403);
  }

  let payload: AdminUsersRequest;
  try {
    payload = await req.json();
  } catch (_err) {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  if (payload.action !== "create") {
    return jsonResponse({ error: "Unsupported action." }, 400);
  }

  const username = normalizeUsername(payload.username);
  const name = normalizeText(payload.name);
  const role = payload.role === "admin" ? "admin" : "user";
  const password = payload.password || "";

  if (!username) {
    return jsonResponse({ error: "ユーザーIDは半角英数字、ハイフン、アンダーバーで入力してください。" }, 400);
  }

  if (!name) {
    return jsonResponse({ error: "表示名を入力してください。" }, 400);
  }

  if (password.length < 6) {
    return jsonResponse({ error: "パスワードは6文字以上で設定してください。" }, 400);
  }

  const email = `${username}@smartfare.local`;
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role,
    },
  });

  if (createError || !created.user) {
    return jsonResponse({ error: createError?.message || "ユーザー作成に失敗しました。" }, 400);
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: created.user.id,
      username,
      name,
      role,
    });

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 400);
  }

  return jsonResponse({
    id: created.user.id,
    username,
    name,
    role,
  });
});

function normalizeUsername(value: unknown): string {
  if (typeof value !== "string") return "";
  const username = value.trim().toLowerCase();
  return /^[a-z0-9_-]{2,32}$/.test(username) ? username : "";
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
