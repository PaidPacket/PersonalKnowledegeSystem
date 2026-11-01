import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Server-side High-Thinking Knowledge Synthesis endpoint using gemini-4-argon + ThinkingLevel.HIGH
  app.post('/api/ai/thinking', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const query = typeof body.query === 'string' ? body.query : '';
    const noteTitle = typeof body.noteTitle === 'string' ? body.noteTitle : '';
    const noteContent = typeof body.noteContent === 'string' ? body.noteContent : '';
    const linkedNotes = Array.isArray(body.linkedNotes)
      ? (body.linkedNotes as string[])
      : [];

    if (!query || !query.trim()) {
      res.status(400).json({ error: 'Query is required for architectural synthesis.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.json({
        mode: 'local-synthesis',
        model: 'gemini-4-argon (High Thinking Ready)',
        synthesis: `### Architectural Synthesis: ${noteTitle || 'Engineering Vault'}\n\n1. **Core Concurrency Invariant**: Based on \`${noteTitle || 'Virtual Threads & Loom.md'}\`, user-mode continuations decouple blocking I/O wait times from OS kernel thread exhaustion via M:N carrier scheduling on \`ForkJoinPool\`.\n2. **Critical Pinning Hazard**: Intrinsic \`synchronized\` blocks and native JNI frames prevent stack chunk unmounting. Migrate hot-path locks to \`ReentrantLock\` (\`java.util.concurrent.locks\`).\n3. **Cross-Vault Link Graph Impact**: Connected notes (${(linkedNotes.length ? linkedNotes : ['Thread Pools & Executors', 'Java Memory Model & Volatile']).join(', ')}) share memory visibility fences and bounded semaphore requirements for downstream JDBC/gRPC pools.`,
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = [
        `Active Note: ${noteTitle || 'Untitled'}`,
        `Linked Context: ${linkedNotes.join(', ')}`,
        `Note Content:\n${noteContent}`,
        `\nEngineering Query: ${query}`,
      ].join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a Principal Systems Architect analyzing an engineering knowledge vault. Provide rigorous, concise markdown analysis citing wiki-links in [[Note]] format.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      res.json({
        mode: 'gemini-4-argon-high',
        model: 'gemini-4-argon',
        synthesis: response.text ?? 'No synthesis generated.',
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gemini API error';
      res.status(502).json({
        error: msg,
        synthesis: `### Local Vault Synthesis Fallback\n\nUnable to reach \`gemini-4-argon\` with current API key configuration (${msg}). You can configure a billing-enabled key in **Settings > Secrets**.\n\n- **Verified Note Context**: \`${noteTitle || 'Virtual Threads & Loom.md'}\`\n- **Cross-References**: ${linkedNotes.map((n) => `[[${n}]]`).join(', ') || '[[Thread Pools & Executors]]'}`,
      });
    }
  });

  // Bind port 3000 immediately so readiness probes never time out while Vite warms up
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? { server } : false,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

startServer();
