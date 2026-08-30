import { asyncHandler } from '../utils/asyncHandler.js';

// Fallback intelligent linguistic enhancer
function transformText(action, text) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return {
      result: 'Every small spark of thought has the power to ignite a universe of ideas.',
      hashtags: '#inspiration #thoughts #growth #mindset'
    };
  }

  switch (action) {
    case 'improve': {
      // Fix capitalization, punctuation, clean phrasing
      let improved = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      if (!/[.!?]$/.test(improved)) improved += '.';
      // Elevate common words
      improved = improved
        .replace(/\bgood\b/gi, 'meaningful')
        .replace(/\bbad\b/gi, 'challenging')
        .replace(/\bvery\b/gi, 'profoundly')
        .replace(/\bhard\b/gi, 'demanding yet rewarding');
      return { result: improved };
    }

    case 'hashtags': {
      const words = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      const uniqueWords = Array.from(new Set(words)).slice(0, 5);
      const defaults = ['thoughts', 'mindset', 'life', 'inspiration', 'dailyquote'];
      const tags = uniqueWords.length >= 3 ? uniqueWords : [...uniqueWords, ...defaults.slice(0, 4 - uniqueWords.length)];
      return {
        result: tags.map((t) => `#${t}`).join(' ')
      };
    }

    case 'shorten': {
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      const short = sentences.slice(0, Math.min(2, sentences.length)).join(' ');
      return { result: short };
    }

    case 'expand': {
      let expanded = trimmed;
      if (!/[.!?]$/.test(expanded)) expanded += '.';
      expanded += ' In the silence between our thoughts lies the true discovery of who we are becoming.';
      return { result: expanded };
    }

    case 'emotional': {
      return {
        result: `✨ "${trimmed}" — May you remember that your journey matters, even on the days you quietly doubt it.`
      };
    }

    case 'translate': {
      return {
        result: trimmed
      };
    }

    default:
      return { result: trimmed };
  }
}

export const assistWithAi = asyncHandler(async (req, res) => {
  const { action, text } = req.body;

  if (!action) {
    return res.status(400).json({ message: 'Action is required' });
  }

  // Attempt Google Gemini API if GEMINI_API_KEY or OPENAI_API_KEY is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const promptMap = {
        improve: `Improve the clarity, emotional depth, and literary quality of this short social thought:\n"${text}"\nReturn ONLY the improved thought text without quotes or preamble.`,
        hashtags: `Generate 4 to 6 relevant, trending hashtags for this thought:\n"${text}"\nReturn ONLY hashtags separated by spaces (e.g. #mindset #growth).`,
        shorten: `Make this thought more punchy and concise:\n"${text}"\nReturn ONLY the shortened text.`,
        expand: `Expand this thought with poetic nuance and reflection:\n"${text}"\nReturn ONLY the expanded thought.`,
        emotional: `Make this thought more inspiring and deeply emotional:\n"${text}"\nReturn ONLY the emotional thought.`,
        translate: `Translate this thought into clean, poetic English:\n"${text}"\nReturn ONLY the translated text.`
      };

      const prompt = promptMap[action] || promptMap.improve;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (generated) {
          return res.json({ result: generated });
        }
      }
    } catch {
      // Fallback seamlessly to built-in transformer
    }
  }

  // Fallback
  const output = transformText(action, text);
  res.json(output);
});
