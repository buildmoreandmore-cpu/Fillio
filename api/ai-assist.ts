import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, data } = req.body;

  try {
    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'review':
        systemPrompt = `You are a financial advisor reviewing a Personal Financial Statement. Analyze the data for:
1. Missing common categories (e.g., if they have income but no cash accounts)
2. Unusual ratios (debt-to-income over 43%, assets much higher/lower than liabilities)
3. Potential errors or inconsistencies
4. Helpful suggestions

Be concise and helpful. Respond in JSON format:
{
  "issues": [{"type": "warning|error|suggestion", "message": "Description"}],
  "insights": [{"label": "Debt-to-Income", "value": "35%", "status": "good|warning|bad", "explanation": "Brief explanation"}],
  "overallHealth": "good|fair|needs-attention"
}`;
        userPrompt = `Review this financial data:\n${JSON.stringify(data, null, 2)}`;
        break;

      case 'explain':
        systemPrompt = `You are a friendly financial educator. Explain financial concepts in plain English with relatable examples. Keep explanations under 100 words. Be helpful, not condescending.`;
        userPrompt = data.question;
        break;

      case 'suggest':
        systemPrompt = `Based on the user's financial entries, suggest what they might be missing or should consider adding. Be specific and actionable. Respond in JSON:
{
  "suggestions": [{"category": "asset|liability", "type": "specific type", "reason": "Why they should consider this"}]
}`;
        userPrompt = `Current entries:\n${JSON.stringify(data, null, 2)}\n\nWhat might they be missing?`;
        break;

      case 'categorize':
        systemPrompt = `You categorize financial items. Given a description, determine the best category and provide a clean description. Respond in JSON:
{
  "category": "cash|investment|realEstate|vehicle|mortgage|autoLoan|creditCard|studentLoan|personalLoan|other",
  "type": "asset|liability",
  "cleanDescription": "Cleaned up description",
  "confidence": 0.95
}`;
        userPrompt = `Categorize: "${data.description}"`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // For explain action, return plain text
    if (action === 'explain') {
      return res.status(200).json({ explanation: responseText });
    }

    // For other actions, parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({ raw: responseText });
    }

    return res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error: any) {
    console.error('AI Assist error:', error);
    return res.status(500).json({
      error: 'AI assistance failed',
      details: error.message
    });
  }
}
