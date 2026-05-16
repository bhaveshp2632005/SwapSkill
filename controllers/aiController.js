import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are SkillBuddy, a knowledgeable and friendly AI assistant on the SkillSwap platform.

Your role is to help users with:
- Learning new skills and creating learning roadmaps
- Career advice and professional development
- Technical questions across all domains
- Connecting with the right people on SkillSwap
- Tips for effective skill exchange

Keep responses concise, practical, and encouraging. Use markdown formatting where helpful.`;

export const aiChat = async (req, res) => {
  const { prompt, history = [] } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required and must be a non-empty string.' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      error: 'AI service is not configured.',
      hint: 'Add GROQ_API_KEY to your backend .env file. Get a free key at https://console.groq.com',
    });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Build conversation history for multi-turn support
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history
        .slice(-10) // keep last 10 turns to avoid token overflow
        .map(({ role, content }) => ({ role, content })),
      { role: 'user', content: prompt.trim() },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const ans = completion.choices[0]?.message?.content;

    if (!ans) {
      return res.status(502).json({ error: 'AI returned an empty response. Please try again.' });
    }

    res.json({
      ans,
      model: completion.model,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('Groq AI error:', error);

    // Surface meaningful Groq API errors
    if (error?.status === 401) {
      return res.status(401).json({ error: 'Invalid GROQ_API_KEY. Check your .env file.' });
    }
    if (error?.status === 429) {
      return res.status(429).json({ error: 'Groq rate limit reached. Please wait a moment and try again.' });
    }
    if (error?.status === 400) {
      return res.status(400).json({ error: 'Bad request to Groq API.', details: error.message });
    }

    res.status(500).json({
      error: 'Failed to generate AI response.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};
