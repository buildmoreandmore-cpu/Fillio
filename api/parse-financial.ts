import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
5. Always respond with valid JSON

RESPONSE FORMAT:
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
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt + contextInfo,
      messages: [
        {
          role: 'user',
          content: `Parse the following into structured financial data:\n\n"${input}"\n\nRespond ONLY with valid JSON.`
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const parsed: ParseResponse = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (error: any) {
    console.error('Claude API error:', error);
    return res.status(500).json({
      error: 'Failed to parse input',
      details: error.message
    });
  }
}
