import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, data } = req.body;

  try {
    let prompt = '';

    switch (action) {
      case 'review':
        prompt = `You are a financial advisor reviewing a Personal Financial Statement. Analyze the data for:
1. Missing common categories (e.g., if they have income but no cash accounts)
2. Unusual ratios (debt-to-income over 43%, assets much higher/lower than liabilities)
3. Potential errors or inconsistencies
4. Helpful suggestions

Be concise and helpful. Respond ONLY with valid JSON (no markdown):
{
  "issues": [{"type": "warning|error|suggestion", "message": "Description"}],
  "insights": [{"label": "Debt-to-Income", "value": "35%", "status": "good|warning|bad", "explanation": "Brief explanation"}],
  "overallHealth": "good|fair|needs-attention"
}

Financial data to review:
${JSON.stringify(data, null, 2)}`;
        break;

      case 'explain':
        prompt = `You are a friendly financial educator. Explain the following financial concept in plain English with relatable examples. Keep explanations under 100 words. Be helpful, not condescending.

Question: ${data.question}`;
        break;

      case 'suggest':
        prompt = `Based on the user's financial entries, suggest what they might be missing or should consider adding. Be specific and actionable. Respond ONLY with valid JSON (no markdown):
{
  "suggestions": [{"category": "asset|liability", "type": "specific type", "reason": "Why they should consider this"}]
}

Current entries:
${JSON.stringify(data, null, 2)}

What might they be missing?`;
        break;

      case 'categorize':
        prompt = `You categorize financial items. Given a description, determine the best category and provide a clean description. Respond ONLY with valid JSON (no markdown):
{
  "category": "cash|investment|realEstate|vehicle|mortgage|autoLoan|creditCard|studentLoan|personalLoan|other",
  "type": "asset|liability",
  "cleanDescription": "Cleaned up description",
  "confidence": 0.95
}

Categorize: "${data.description}"`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    });

    const responseText = result.response.text();

    // For explain action, return plain text
    if (action === 'explain') {
      return res.status(200).json({ explanation: responseText });
    }

    // For other actions, parse JSON
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const plainJsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (plainJsonMatch) {
        jsonStr = plainJsonMatch[0];
      }
    }

    return res.status(200).json(JSON.parse(jsonStr));

  } catch (error: any) {
    console.error('AI Assist error:', error);
    return res.status(500).json({
      error: 'AI assistance failed',
      details: error.message
    });
  }
}
