import * as FileSystem from 'expo-file-system';
import { AIProvider } from '@/utils/aiStorage';

export interface ExtractedTransaction {
  name: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  categoryName: string;
  paymentMethod?: string;
  description?: string;
}

export type StreamCallback = (chunk: string, fullText: string) => void;

const VALID_CATEGORIES = ['餐饮', '交通', '购物', '家用', '账单', '工资'];

const CATEGORY_MAPPINGS: Record<string, string> = {
  '食物': '餐饮', '餐饮美食': '餐饮', '美食': '餐饮', '食品': '餐饮',
  '早餐': '餐饮', '午餐': '餐饮', '晚餐': '餐饮', '外卖': '餐饮',
  '咖啡': '餐饮', '奶茶': '餐饮', '小吃': '餐饮', '零食': '餐饮',
  '出行': '交通', '打车': '交通', '运输': '交通', '滴滴': '交通',
  '公交': '交通', '地铁': '交通', '加油': '交通', '停车': '交通',
  '消费': '购物', '日用': '购物', '百货': '购物', '超市': '购物',
  '网购': '购物', '商场': '购物', '淘宝': '购物', '京东': '购物',
  '居住': '家用', '生活': '家用', '水电': '家用', '房租': '家用',
  '物业': '家用', '家具': '家用', '家电': '家用',
  '缴费': '账单', '服务': '账单', '通讯': '账单', '话费': '账单',
  '网费': '账单', '保险': '账单', '还款': '账单',
  '收入': '工资', '薪酬': '工资', '奖金': '工资', '报销': '工资',
};

function validateCategory(name: string): string {
  if (!name) return '购物';
  if (VALID_CATEGORIES.includes(name)) return name;
  return CATEGORY_MAPPINGS[name] || '购物';
}

const PROMPT_MULTI = `你是一个财务数据提取助手。我会给你多张支付截图（可能来自支付宝、微信支付、银行App等），请仔细分析所有截图，提取所有交易记录。

重要：
1. 多张截图可能有重叠的交易内容，请自行去重，同一笔交易不要重复提取
2. 你必须只返回一个纯 JSON 数组，不要添加任何解释文字、标题或markdown格式
3. 不要说"以下是结果"之类的话，直接返回JSON

JSON数组中每个对象包含以下字段：
- name: string, 交易名称/商户名
- amount: number, 金额（正数，不带货币符号）
- date: string, 日期，格式 YYYY-MM-DD
- type: string, "expense" 或 "income"
- categoryName: string, 必须是以下之一：餐饮、交通、购物、家用、账单、工资
- paymentMethod: string, 支付方式（如支付宝、微信支付、银行卡等）
- description: string, 备注信息（可选）

分类规则：餐饮（餐厅外卖等）、交通（打车公交等）、购物（超市网购等）、家用（水电房租等）、账单（话费保险等）、工资（收入）

如果无法识别任何交易，返回空数组 []

今天的日期是：${new Date().toISOString().split('T')[0]}`;

function parseAIResponse(content: string): ExtractedTransaction[] {
  let jsonStr = content.trim();

  // Strip markdown code fences (```json ... ```)
  jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '');

  // Try to find a JSON array - look for the first [ and last ]
  const firstBracket = jsonStr.indexOf('[');
  const lastBracket = jsonStr.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
  }

  // Try parsing the extracted JSON
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item): ExtractedTransaction => ({
          name: String(item.name || item.merchant || item.description || '未知'),
          amount: Math.abs(Number(item.amount || item.price || item.total || 0)),
          date: item.date || new Date().toISOString().split('T')[0],
          type: item.type === 'income' ? 'income' : 'expense',
          categoryName: validateCategory(item.categoryName || item.category || ''),
          paymentMethod: item.paymentMethod || item.payment || undefined,
          description: item.description || item.note || undefined,
        }))
        .filter(t => t.amount > 0);
    }
  } catch {
    // JSON parse failed, try harder to extract data
  }

  // Last resort: try to find JSON objects individually
  const objects: any[] = [];
  const objRegex = /\{[^}]+\}/g;
  let match;
  while ((match = objRegex.exec(content)) !== null) {
    try {
      const obj = JSON.parse(match[0]);
      if (obj.name || obj.amount) objects.push(obj);
    } catch {
      // Skip invalid objects
    }
  }

  if (objects.length > 0) {
    return objects
      .map((item): ExtractedTransaction => ({
        name: String(item.name || item.merchant || '未知'),
        amount: Math.abs(Number(item.amount || 0)),
        date: item.date || new Date().toISOString().split('T')[0],
        type: item.type === 'income' ? 'income' : 'expense',
        categoryName: validateCategory(item.categoryName || item.category || ''),
        paymentMethod: item.paymentMethod || undefined,
        description: item.description || undefined,
      }))
      .filter(t => t.amount > 0);
  }

  throw new Error('无法从 AI 响应中解析交易数据');
}

/**
 * Extract transactions from multiple images in a single request.
 * All images are sent together so the AI can detect overlapping transactions.
 */
export async function extractTransactionsFromImages(
  provider: AIProvider,
  imageUris: string[],
  onStream?: StreamCallback
): Promise<ExtractedTransaction[]> {
  // Read all images as base64
  const imageContents = await Promise.all(
    imageUris.map(async (uri) => {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return {
        type: 'image_url' as const,
        image_url: { url: `data:image/jpeg;base64,${base64}` },
      };
    })
  );

  const messages = [
    {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: PROMPT_MULTI },
        ...imageContents,
      ],
    },
  ];

  // Try streaming first
  if (onStream) {
    try {
      const streamResponse = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.modelName,
          stream: true,
          messages,
          max_tokens: 4000,
          temperature: 0.1,
        }),
      });

      if (streamResponse.ok && streamResponse.body) {
        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
              const chunk = JSON.parse(data);
              const delta = chunk.choices?.[0]?.delta?.content
                || chunk.choices?.[0]?.delta?.reasoning_content
                || '';
              if (delta) {
                fullText += delta;
                onStream(delta, fullText);
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        if (fullText) return parseAIResponse(fullText);
      }
    } catch {
      // Streaming not supported, fall through to non-streaming
    }
  }

  // Non-streaming mode (always works reliably)
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.modelName,
      stream: false,
      messages,
      max_tokens: 4000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content
    || data.choices?.[0]?.message?.reasoning_content
    || '';
  if (!content) throw new Error('AI 返回内容为空');
  if (onStream) onStream(content, content);
  return parseAIResponse(content);
}

/**
 * Test if an AI provider's API key and endpoint work.
 * Sends a simple text-only request and checks the response.
 */
export async function testConnection(provider: AIProvider): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.modelName,
        messages: [{ role: 'user', content: '你好，请回复"连接成功"两个字' }],
        max_tokens: 500,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { ok: false, message: `HTTP ${response.status}: ${errorText.slice(0, 200)}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content
      || data.choices?.[0]?.message?.reasoning_content
      || '';
    if (!content) {
      return { ok: false, message: 'API 返回内容为空，请检查模型名称是否正确' };
    }
    return { ok: true, message: `连接成功！AI 回复: "${content.slice(0, 100)}"` };
  } catch (err: any) {
    return { ok: false, message: `网络错误: ${err.message}` };
  }
}
