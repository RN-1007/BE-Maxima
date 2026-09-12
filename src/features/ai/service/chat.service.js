const path = require('path');
const fs = require('fs');
const axios = require('axios');
const prisma = require('../../../config/database');
const { GEMINI_API_KEY, GEMINI_MODEL, AI_CHAT_URL } = require('../../../config/env');

/**
 * Helper to get MIME type from file path or URL
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
};

/**
 * Fetch and convert image (from local path or remote URL) to Gemini inlineData format
 * @param {string} imageUrl
 * @returns {Promise<{ mimeType: string, data: string } | null>}
 */
const getImageInlineData = async (imageUrl) => {
  try {
    if (!imageUrl || typeof imageUrl !== 'string') return null;

    // 1. Check if it's a local uploaded file (e.g. /uploads/leaves/leaf-123.jpg)
    if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('uploads')) {
      const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
      const fullPath = path.resolve(process.cwd(), cleanPath);
      if (fs.existsSync(fullPath)) {
        const fileBuffer = fs.readFileSync(fullPath);
        return {
          mimeType: getMimeType(fullPath),
          data: fileBuffer.toString('base64'),
        };
      }
    }

    // 2. Remote HTTP / HTTPS URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 8000,
      });
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const base64Data = Buffer.from(response.data).toString('base64');
      return {
        mimeType: contentType,
        data: base64Data,
      };
    }
  } catch (err) {
    console.warn(`[ChatService] Gagal memuat gambar dari '${imageUrl}': ${err.message}`);
  }
  return null;
};

/**
 * Resolve context data from database if treeId is provided
 * @param {string} [treeId]
 * @param {string} [explicitContext]
 * @returns {Promise<string>}
 */
const resolveDbContext = async (treeId, explicitContext = '') => {
  let contextParts = [];

  if (explicitContext && typeof explicitContext === 'string' && explicitContext.trim()) {
    contextParts.push(explicitContext.trim());
  }

  if (treeId) {
    try {
      const tree = await prisma.tree.findUnique({
        where: { id: treeId },
        include: {
          farmer: { select: { name: true, location: true } },
          aiLogs: { orderBy: { detectedAt: 'desc' }, take: 2 },
          fertilizations: { orderBy: { scheduledDate: 'desc' }, take: 2 },
        },
      });

      if (tree) {
        let treeSummary = `[Data Pohon Terdaftar di Database]: Kode: ${tree.treeCode}, Varietas: ${tree.variety || 'Jeruk Bali Merah'}, Status Kesehatan Saat Ini: ${tree.healthStatus}, Blok Lahan: ${tree.locationBlock || 'Kebun Magetan'}.`;
        
        if (tree.farmer?.name) {
          treeSummary += ` Pemilik: ${tree.farmer.name} (${tree.farmer.location || 'Magetan'}).`;
        }

        if (tree.aiLogs && tree.aiLogs.length > 0) {
          const latestAi = tree.aiLogs[0];
          treeSummary += ` Riwayat Deteksi AI Terakhir: ${latestAi.result} (Keyakinan: ${latestAi.confidence}%, Status: ${latestAi.isSick ? 'Sakit' : 'Sehat'}, Tanggal: ${new Date(latestAi.detectedAt).toLocaleDateString('id-ID')}).`;
        }

        if (tree.fertilizations && tree.fertilizations.length > 0) {
          const latestFert = tree.fertilizations[0];
          treeSummary += ` Jadwal Pemupukan Terakhir: ${latestFert.fertilizerType} (Status: ${latestFert.status}).`;
        }

        contextParts.unshift(treeSummary);
      }
    } catch (dbErr) {
      console.warn(`[ChatService] Gagal mengambil db context untuk treeId ${treeId}: ${dbErr.message}`);
    }
  }

  return contextParts.join('\n\n');
};

/**
 * Format conversation history into Gemini contents format
 * @param {Array<Object>} history
 * @returns {Array<Object>}
 */
const formatGeminiHistory = (history = []) => {
  if (!Array.isArray(history)) return [];

  const formatted = [];
  for (const item of history) {
    let role = item.role;
    if (role === 'assistant') role = 'model';
    if (role !== 'user' && role !== 'model') continue;

    let parts = [];
    if (Array.isArray(item.parts)) {
      parts = item.parts.map((p) => (typeof p === 'string' ? { text: p } : p));
    } else if (typeof item.content === 'string') {
      parts = [{ text: item.content }];
    } else if (typeof item.message === 'string') {
      parts = [{ text: item.message }];
    }

    if (parts.length > 0) {
      formatted.push({ role, parts });
    }
  }
  return formatted;
};

/**
 * Main chat handler connecting db_context with Gemini AI / Microservice
 * @param {Object} params
 * @param {string} params.message
 * @param {string} [params.db_context]
 * @param {string} [params.treeId]
 * @param {string} [params.image_url]
 * @param {Array<Object>} [params.history]
 * @returns {Promise<{ reply: string, db_context_used?: string }>}
 */
const chatWithAssistant = async ({ message, db_context, treeId, image_url, history }) => {
  // 1. Validation
  if (!message || typeof message !== 'string' || !message.trim()) {
    const error = new Error("Parameter 'message' wajib diisi dan tidak boleh kosong.");
    error.statusCode = 400;
    error.statusType = 'fail';
    throw error;
  }

  // 2. Resolve enriched db_context from Postgres
  const finalDbContext = await resolveDbContext(treeId, db_context);

  // 3. Primary Path: Hit AI Engineer's Microservice (via AI_CHAT_URL)
  const targetChatUrl = AI_CHAT_URL || 'http://localhost:5000/api/v1/chat';

  try {
    const response = await axios.post(
      targetChatUrl,
      {
        message: message.trim(),
        db_context: finalDbContext,
        image_url: image_url || null,
        history: history || [],
      },
      { timeout: 20000 }
    );

    const resData = response.data;
    if (resData?.data?.reply) {
      return {
        reply: resData.data.reply,
        db_context_used: finalDbContext || undefined,
      };
    }
    if (resData?.reply) {
      return {
        reply: resData.reply,
        db_context_used: finalDbContext || undefined,
      };
    }
  } catch (microserviceErr) {
    console.warn(`[ChatService] Microservice AI (${targetChatUrl}) error: ${microserviceErr.message}`);

    // If microservice failed, check if Gemini direct fallback is configured
    if (!GEMINI_API_KEY) {
      const error = new Error(
        `Layanan AI Chatbot (${targetChatUrl}) tidak dapat dihubungi. Pastikan server AI Engineer sedang berjalan.`
      );
      error.statusCode = 500;
      error.statusType = 'error';
      throw error;
    }
  }

  // 4. Secondary Fallback Path: Direct Gemini REST API (only if GEMINI_API_KEY is provided)
  const systemInstructionText = `Kamu adalah Maxist (Citrus Maxima Assistant), asisten AI pintar, ramah, dan solutif yang bertugas mendampingi petani jeruk bali (Citrus maxima / Pamelo Magetan) serta konsumen.
Gunakan data [KONTEKS DATABASE] jika tersedia untuk memberikan jawaban yang spesifik.`;

  const geminiContents = formatGeminiHistory(history);
  const currentParts = [];

  if (image_url) {
    const inlineImage = await getImageInlineData(image_url);
    if (inlineImage) {
      currentParts.push({ inlineData: inlineImage });
    }
  }

  let messageWithContext = '';
  if (finalDbContext) {
    messageWithContext += `[KONTEKS DATABASE KEBUN / DATA TERAKHIR]:\n${finalDbContext}\n\n`;
  }
  messageWithContext += `[PERTANYAAN]:\n${message.trim()}`;

  currentParts.push({ text: messageWithContext });
  geminiContents.push({ role: 'user', parts: currentParts });

  const modelName = GEMINI_MODEL || 'gemini-1.5-flash';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const geminiPayload = {
      systemInstruction: { parts: [{ text: systemInstructionText }] },
      contents: geminiContents,
      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 1024 },
    };

    const response = await axios.post(geminiUrl, geminiPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });

    const candidate = response.data?.candidates?.[0];
    const replyText =
      candidate?.content?.parts?.map((p) => p.text).join('\n') ||
      'Halo Bapak/Ibu Petani! Mohon maaf, Maxist belum dapat memproses jawaban saat ini.';

    return {
      reply: replyText.trim(),
      db_context_used: finalDbContext || undefined,
    };
  } catch (apiError) {
    const errMessage = apiError.response?.data?.error?.message || apiError.message;
    const error = new Error(`Gagal memproses respons AI: ${errMessage}`);
    error.statusCode = 500;
    error.statusType = 'error';
    throw error;
  }
};

module.exports = {
  chatWithAssistant,
  resolveDbContext,
};
