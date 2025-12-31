import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface FinancialItem {
  category: string;
  description: string;
  value: number;
  type: 'asset' | 'liability';
  subtype?: string;
}

interface ParseResponse {
  items: FinancialItem[];
  suggestions?: string[];
  followUp?: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, context } = req.body;

  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }

  const systemPrompt = `You are a financial document assistant helping users create Personal Financial Statements. Your job is to parse natural language descriptions of assets and liabilities into structured data.

CATEGORIES:
Assets:
- "cash" - Bank accounts, checking, savings, cash on hand
- "investment" - Stocks, bonds, mutual funds, 401k, IRA, retirement accounts
- "realEstate" - Properties, land, rental properties, primary residence
- "vehicle" - Cars, trucks, motorcycles, boats
- "other" - Other valuable assets (jewelry, art, equipment, etc.)

Liabilities:
- "mortgage" - Home loans, property mortgages
- "autoLoan" - Car loans, vehicle financing
- "creditCard" - Credit card balances
- "studentLoan" - Education loans
- "personalLoan" - Personal loans, money owed to individuals
- "businessLoan" - Business-related debts
- "other" - Other debts

RULES:
1. Extract ALL financial items mentioned
2. Infer reasonable values when users say "about" or "around" or "like"
3. Categorize each item appropriately
4. If something is ambiguous, make your best guess but flag it
5. Always respond with valid JSON only, no markdown

RESPONSE FORMAT (JSON only):
{
  "items": [
    {
      "category": "cash|investment|realEstate|vehicle|other|mortgage|autoLoan|creditCard|studentLoan|personalLoan|businessLoan",
      "description": "Clear description of the item",
      "value": 12000,
      "type": "asset|liability",
      "subtype": "Optional more specific type"
    }
  ],
  "suggestions": ["Optional follow-up suggestions based on what they mentioned"],
  "followUp": "Optional clarifying question if something was unclear"
}`;

  const contextInfo = context ? `\nCurrent context: The user is describing their ${context}.` : '';

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}${contextInfo}\n\nParse the following into structured financial data:\n\n"${input}"\n\nRespond ONLY with valid JSON, no markdown code blocks.` }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    });

    const responseText = result.response.text();

    // Extract JSON from response (handle potential markdown code blocks)
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

    const parsed: ParseResponse = JSON.parse(jsonStr);
    return res.status(200).json(parsed);

  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({
      error: 'Failed to parse input',
      details: error.message
    });
  }
}
