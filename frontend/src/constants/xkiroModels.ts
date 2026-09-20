/**
 * xKiro.com AI Gateway — Verified Model Catalog
 * ===============================================
 * These are the ACTUAL 112 models available on xKiro.com,
 * verified via the live /models API endpoint.
 * 
 * xKiro uses namespaced provider/model-name format.
 * Last verified: 2026-09-09
 */

export interface ModelItem {
  id: string;
  name: string;
  provider: string;
  badge: string;
}

export const MASTER_XKIRO_MODELS: ModelItem[] = [
  // --- Anthropic ---
  { id: "anthropic/claude-fable-5", name: "Claude Fable 5", provider: "Anthropic", badge: "Creative" },
  { id: "anthropic/claude-fable-5-1", name: "Claude Fable 5.1", provider: "Anthropic", badge: "Creative" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "Anthropic", badge: "Ultra Fast" },
  { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", provider: "Anthropic", badge: "Deep Reasoning" },
  { id: "anthropic/claude-opus-4.7", name: "Claude Opus 4.7", provider: "Anthropic", badge: "Deep Reasoning" },
  { id: "anthropic/claude-opus-4.8", name: "Claude Opus 4.8", provider: "Anthropic", badge: "Latest Reasoning" },
  { id: "anthropic/claude-opus-5", name: "Claude Opus 5", provider: "Anthropic", badge: "Frontier" },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", provider: "Anthropic", badge: "Balanced" },
  { id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5", provider: "Anthropic", badge: "Top Coding" },

  // --- DeepSeek ---
  { id: "deepseek/deepseek-chat-v3.1", name: "DeepSeek Chat V3.1", provider: "DeepSeek", badge: "General" },
  { id: "deepseek/deepseek-v3.2", name: "DeepSeek V3.2", provider: "DeepSeek", badge: "MoE" },
  { id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "DeepSeek", badge: "Fast" },
  { id: "deepseek/deepseek-v4-flash-0731", name: "DeepSeek V4 Flash (0731)", provider: "DeepSeek", badge: "Dated" },
  { id: "deepseek/deepseek-v4-flash-vision-exp", name: "DeepSeek V4 Flash Vision", provider: "DeepSeek", badge: "Vision" },
  { id: "deepseek/deepseek-v4-pro", name: "DeepSeek V4 Pro", provider: "DeepSeek", badge: "Frontier" },
  { id: "deepseek/deepseek-v4-pro-0813", name: "DeepSeek V4 Pro (0813)", provider: "DeepSeek", badge: "Dated" },

  // --- Google (Gemini) ---
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", badge: "Reasoning" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", badge: "Balanced" },
  { id: "google/gemini-3-flash", name: "Gemini 3 Flash", provider: "Google", badge: "Fast" },
  { id: "google/gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "Google", badge: "Pro" },
  { id: "google/gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "Google", badge: "High Speed" },
  { id: "google/gemini-3.6-flash", name: "Gemini 3.6 Flash", provider: "Google", badge: "Latest Flash" },
  { id: "google/gemini-3.7-flash", name: "Gemini 3.7 Flash", provider: "Google", badge: "Edge" },
  { id: "google/gemini-3.8-flash", name: "Gemini 3.8 Flash", provider: "Google", badge: "Newest" },

  // --- Meta ---
  { id: "meta/muse-spark-1.2-contributor", name: "Muse Spark 1.2", provider: "Meta", badge: "Creative" },

  // --- MiniMax ---
  { id: "minimax/minimax-m2.1-highspeed:free", name: "MiniMax M2.1 HighSpeed", provider: "MiniMax", badge: "Free" },
  { id: "minimax/minimax-m2.1:free", name: "MiniMax M2.1", provider: "MiniMax", badge: "Free" },
  { id: "minimax/minimax-m2.5", name: "MiniMax M2.5", provider: "MiniMax", badge: "Pro" },
  { id: "minimax/minimax-m2.5-highspeed:free", name: "MiniMax M2.5 HighSpeed", provider: "MiniMax", badge: "Free" },
  { id: "minimax/minimax-m2.5:free", name: "MiniMax M2.5", provider: "MiniMax", badge: "Free" },
  { id: "minimax/minimax-m2.7", name: "MiniMax M2.7", provider: "MiniMax", badge: "Pro" },
  { id: "minimax/minimax-m2.7-highspeed:free", name: "MiniMax M2.7 HighSpeed", provider: "MiniMax", badge: "Free" },
  { id: "minimax/minimax-m2.7:free", name: "MiniMax M2.7", provider: "MiniMax", badge: "Free" },
  { id: "minimax/minimax-m2:free", name: "MiniMax M2", provider: "MiniMax", badge: "Free" },
  { id: "minimax/minimax-m3", name: "MiniMax M3", provider: "MiniMax", badge: "Latest" },
  { id: "minimax/minimax-m3:free", name: "MiniMax M3", provider: "MiniMax", badge: "Free" },

  // --- Mistral ---
  { id: "mistralai/codestral-2508", name: "Codestral 2508", provider: "Mistral", badge: "Code" },
  { id: "mistralai/devstral-medium", name: "Devstral Medium", provider: "Mistral", badge: "Dev" },
  { id: "mistralai/ministral-14b", name: "Ministral 14B", provider: "Mistral", badge: "Balanced" },
  { id: "mistralai/ministral-3b", name: "Ministral 3B", provider: "Mistral", badge: "Ultra Light" },
  { id: "mistralai/ministral-8b", name: "Ministral 8B", provider: "Mistral", badge: "Fast" },
  { id: "mistralai/mistral-large-2512", name: "Mistral Large 2512", provider: "Mistral", badge: "Flagship" },
  { id: "mistralai/mistral-medium-3.5", name: "Mistral Medium 3.5", provider: "Mistral", badge: "Balanced" },
  { id: "mistralai/mistral-small-2603", name: "Mistral Small 2603", provider: "Mistral", badge: "Efficient" },

  // --- Moonshot AI (Kimi) ---
  { id: "moonshotai/kimi-k2.5", name: "Kimi K2.5", provider: "Moonshot", badge: "General" },
  { id: "moonshotai/kimi-k2.6", name: "Kimi K2.6", provider: "Moonshot", badge: "Advanced" },
  { id: "moonshotai/kimi-k2.7-code", name: "Kimi K2.7 Code", provider: "Moonshot", badge: "Coding" },
  { id: "moonshotai/kimi-k3", name: "Kimi K3", provider: "Moonshot", badge: "Latest" },

  // --- NVIDIA ---
  { id: "nvidia/llama-3.3-nemotron-super-49b", name: "Nemotron Super 49B", provider: "NVIDIA", badge: "Alignment" },
  { id: "nvidia/nemotron-3-nano", name: "Nemotron 3 Nano", provider: "NVIDIA", badge: "Lightweight" },
  { id: "nvidia/nemotron-3-nano-omni", name: "Nemotron 3 Nano Omni", provider: "NVIDIA", badge: "Multimodal" },
  { id: "nvidia/nemotron-3-super", name: "Nemotron 3 Super", provider: "NVIDIA", badge: "Powerful" },
  { id: "nvidia/nemotron-3-ultra", name: "Nemotron 3 Ultra", provider: "NVIDIA", badge: "Frontier" },

  // --- OpenAI ---
  { id: "openai/gpt-5.3-codex-spark", name: "GPT-5.3 Codex Spark", provider: "OpenAI", badge: "Code" },
  { id: "openai/gpt-5.4", name: "GPT-5.4", provider: "OpenAI", badge: "Standard" },
  { id: "openai/gpt-5.4-mini", name: "GPT-5.4 Mini", provider: "OpenAI", badge: "Cost Efficient" },
  { id: "openai/gpt-5.5", name: "GPT-5.5", provider: "OpenAI", badge: "Advanced" },
  { id: "openai/gpt-5.6-luna", name: "GPT-5.6 Luna", provider: "OpenAI", badge: "Creative" },
  { id: "openai/gpt-5.6-sol", name: "GPT-5.6 Sol", provider: "OpenAI", badge: "Reasoning" },
  { id: "openai/gpt-5.6-terra", name: "GPT-5.6 Terra", provider: "OpenAI", badge: "Grounded" },
  { id: "openai/gpt-6-astra", name: "GPT-6 Astra", provider: "OpenAI", badge: "Flagship" },

  // --- Qwen ---
  { id: "qwen/qwen-plus-2025-07-28:free", name: "Qwen Plus", provider: "Qwen", badge: "Free" },
  { id: "qwen/qwen3-coder-plus:free", name: "Qwen3 Coder Plus", provider: "Qwen", badge: "Free Code" },
  { id: "qwen/qwen3-max:free", name: "Qwen3 Max", provider: "Qwen", badge: "Free" },
  { id: "qwen/qwen3-omni-flash:free", name: "Qwen3 Omni Flash", provider: "Qwen", badge: "Free Multimodal" },
  { id: "qwen/qwen3-vl-plus:free", name: "Qwen3 VL Plus", provider: "Qwen", badge: "Free Vision" },
  { id: "qwen/qwen3.5-397b-a17b:free", name: "Qwen3.5 397B", provider: "Qwen", badge: "Free MoE" },
  { id: "qwen/qwen3.5-flash:free", name: "Qwen3.5 Flash", provider: "Qwen", badge: "Free Fast" },
  { id: "qwen/qwen3.5-omni-flash:free", name: "Qwen3.5 Omni Flash", provider: "Qwen", badge: "Free Multimodal" },
  { id: "qwen/qwen3.5-omni-plus:free", name: "Qwen3.5 Omni Plus", provider: "Qwen", badge: "Free" },
  { id: "qwen/qwen3.5-plus", name: "Qwen3.5 Plus", provider: "Qwen", badge: "Pro" },
  { id: "qwen/qwen3.5-plus:free", name: "Qwen3.5 Plus", provider: "Qwen", badge: "Free" },
  { id: "qwen/qwen3.6-27b:free", name: "Qwen3.6 27B", provider: "Qwen", badge: "Free" },
  { id: "qwen/qwen3.6-35b-a3b:free", name: "Qwen3.6 35B MoE", provider: "Qwen", badge: "Free MoE" },
  { id: "qwen/qwen3.6-max-preview:free", name: "Qwen3.6 Max Preview", provider: "Qwen", badge: "Free Preview" },
  { id: "qwen/qwen3.6-plus", name: "Qwen3.6 Plus", provider: "Qwen", badge: "Pro" },
  { id: "qwen/qwen3.6-plus:free", name: "Qwen3.6 Plus", provider: "Qwen", badge: "Free" },
  { id: "qwen/qwen3.7-max", name: "Qwen3.7 Max", provider: "Qwen", badge: "Pro Flagship" },
  { id: "qwen/qwen3.7-max:free", name: "Qwen3.7 Max", provider: "Qwen", badge: "Free" },
  { id: "qwen/qwen3.7-plus", name: "Qwen3.7 Plus", provider: "Qwen", badge: "Pro" },
  { id: "qwen/qwen3.7-plus:free", name: "Qwen3.7 Plus", provider: "Qwen", badge: "Free" },
  { id: "qwen/qwen3.8-max", name: "Qwen3.8 Max", provider: "Qwen", badge: "Latest Max" },
  { id: "qwen/qwen3.8-max:free", name: "Qwen3.8 Max", provider: "Qwen", badge: "Free Latest" },

  // --- SenseNova ---
  { id: "sensenova/sensenova-6.7-flash-lite", name: "SenseNova 6.7 Flash", provider: "SenseNova", badge: "Fast" },
  { id: "sensenova/sensenova-6.8-flash-lite", name: "SenseNova 6.8 Flash", provider: "SenseNova", badge: "Latest" },

  // --- Tencent ---
  { id: "tencent/hy3", name: "Hunyuan 3", provider: "Tencent", badge: "General" },
  { id: "tencent/hy4-preview", name: "Hunyuan 4 Preview", provider: "Tencent", badge: "Preview" },

  // --- xAI (Grok) ---
  { id: "x-ai/grok-4.5", name: "Grok 4.5", provider: "xAI", badge: "Reasoning" },
  { id: "x-ai/grok-4.6", name: "Grok 4.6", provider: "xAI", badge: "Latest" },
  { id: "x-ai/grok-build-0.1", name: "Grok Build 0.1", provider: "xAI", badge: "Code" },

  // --- Xiaomi ---
  { id: "xiaomi/mimo-v2.5", name: "MiMo V2.5", provider: "Xiaomi", badge: "Specialist" },
  { id: "xiaomi/mimo-v2.5-pro", name: "MiMo V2.5 Pro", provider: "Xiaomi", badge: "Pro" },

  // --- Zhipu AI (GLM) ---
  { id: "z-ai/glm-4.5", name: "GLM 4.5", provider: "Zhipu AI", badge: "General" },
  { id: "z-ai/glm-4.5-air", name: "GLM 4.5 Air", provider: "Zhipu AI", badge: "Light" },
  { id: "z-ai/glm-4.5-airx", name: "GLM 4.5 AirX", provider: "Zhipu AI", badge: "Fast" },
  { id: "z-ai/glm-4.5-flash", name: "GLM 4.5 Flash", provider: "Zhipu AI", badge: "Ultra Fast" },
  { id: "z-ai/glm-4.5-x", name: "GLM 4.5 X", provider: "Zhipu AI", badge: "Extended" },
  { id: "z-ai/glm-4.5v", name: "GLM 4.5V", provider: "Zhipu AI", badge: "Vision" },
  { id: "z-ai/glm-4.6", name: "GLM 4.6", provider: "Zhipu AI", badge: "Pro" },
  { id: "z-ai/glm-4.6v", name: "GLM 4.6V", provider: "Zhipu AI", badge: "Vision" },
  { id: "z-ai/glm-4.6v-flash", name: "GLM 4.6V Flash", provider: "Zhipu AI", badge: "Fast Vision" },
  { id: "z-ai/glm-4.6v-flashx", name: "GLM 4.6V FlashX", provider: "Zhipu AI", badge: "Ultra Fast Vision" },
  { id: "z-ai/glm-4.7", name: "GLM 4.7", provider: "Zhipu AI", badge: "Latest" },
  { id: "z-ai/glm-4.7-flash", name: "GLM 4.7 Flash", provider: "Zhipu AI", badge: "Fast" },
  { id: "z-ai/glm-4.7-flashx", name: "GLM 4.7 FlashX", provider: "Zhipu AI", badge: "Ultra Fast" },
  { id: "z-ai/glm-5", name: "GLM 5", provider: "Zhipu AI", badge: "Frontier" },
  { id: "z-ai/glm-5-turbo", name: "GLM 5 Turbo", provider: "Zhipu AI", badge: "Speed" },
  { id: "z-ai/glm-5.1", name: "GLM 5.1", provider: "Zhipu AI", badge: "Advanced" },
  { id: "z-ai/glm-5.2", name: "GLM 5.2", provider: "Zhipu AI", badge: "Pro" },
  { id: "z-ai/glm-5.3", name: "GLM 5.3", provider: "Zhipu AI", badge: "Latest" },
  { id: "z-ai/glm-5.3-flash", name: "GLM 5.3 Flash", provider: "Zhipu AI", badge: "Fast Latest" },
  { id: "z-ai/glm-5v-turbo", name: "GLM 5V Turbo", provider: "Zhipu AI", badge: "Vision Speed" },
];

export const XKIRO_PROVIDERS = [
  "ALL",
  "Anthropic",
  "OpenAI",
  "Google",
  "DeepSeek",
  "Mistral",
  "Qwen",
  "NVIDIA",
  "xAI",
  "Xiaomi",
  "MiniMax",
  "Moonshot",
  "Tencent",
  "Zhipu AI",
  "SenseNova",
  "Meta",
];
