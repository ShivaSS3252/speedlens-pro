import Groq from 'groq-sdk';

const client = new Groq();

// Cache fixes so the same issue is never sent to Groq twice
const fixCache = new Map();

const SYSTEM_PROMPT = `You are a web performance expert. Return ONLY a valid JSON object — no markdown, no prose, no explanation outside JSON.

Shape: {"language":"string","code":"string","explanation":"string"}

- language: e.g. "javascript", "html", "nginx"
- code: a short, ready-to-use code snippet
- explanation: one sentence on what it does`;

function extractJson(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw.trim()); } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) try { return JSON.parse(fenced[1].trim()); } catch {}
  const block = raw.match(/\{[\s\S]*?\}/);
  if (block) try { return JSON.parse(block[0]); } catch {}
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function generateFix({ title, description, displayValue }, techStack, attempt = 0) {
  const cacheKey = `${title}::${techStack}`;
  if (fixCache.has(cacheKey)) return fixCache.get(cacheKey);

  const userMessage = `Tech stack: ${techStack}
Issue: ${title}
${description ? `Details: ${description}` : ''}${displayValue ? `\nMeasurement: ${displayValue}` : ''}

Return a JSON fix object.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 400,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson(raw);

    if (!parsed) {
      if (attempt < 2) { await sleep(800); return generateFix({ title, description, displayValue }, techStack, attempt + 1); }
      return null;
    }

    const fix = {
      language: parsed.language ?? 'javascript',
      code: parsed.code ?? '// No snippet available',
      explanation: parsed.explanation ?? 'Apply this fix to improve performance.',
    };

    fixCache.set(cacheKey, fix);
    return fix;
  } catch (err) {
    console.error(`[fix-generator] attempt ${attempt + 1} failed:`, err?.message ?? err);
    if (attempt < 2) { await sleep(1000 * (attempt + 1)); return generateFix({ title, description, displayValue }, techStack, attempt + 1); }
    return null;
  }
}
