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

重要：多张截图可能有重叠的交易内容，请自行去重，同一笔交易不要重复提取。

请以严格的 JSON 数组格式返回，每个交易对象包含以下字段：
- name: string, 交易名称/商户名
- amount: number, 金额（正数）
- date: string, 日期，格式 YYYY-MM-DD（如截图中无日期，使用今天的日期）
- type: string, "expense" 或 "income"
- categoryName: string, 必须是以下之一：餐饮、交通、购物、家用、账单、工资
- paymentMethod: string, 支付方式（如支付宝、微信支付、银行卡等）
- description: string, 备注信息（可选，如有）

分类规则：
- 餐饮：餐厅、外卖、咖啡、奶茶、小吃等食物相关
- 交通：打车、公交、地铁、加油、停车等出行相关
- 购物：超市、商场、网购等商品购买
- 家用：水电煤、房租、物业、家具家电等居家相关
- 账单：话费、网费、保险、还款等定期账单
- 工资：工资、奖金、报销等收入

注意事项：
- 如果截图中有多笔交易，全部提取
- 金额必须是数字，不带货币符号
- 只返回 JSON 数组，不要添加其他文字说明
- 如果无法识别任何交易，返回空数组 []
- 多张截图中重复的交易只保留一条

今天的日期是：${new Date().toISOString().split('T')[0]}

返回格式示例：
[{"name":"肯德基","amount":35.5,"date":"2024-01-15","type":"expense","categoryName":"餐饮","paymentMethod":"支付宝","description":"午餐"}]`;

function parseAIResponse(content: string): ExtractedTransaction[] {
  let jsonStr = content.trim();
  // Strip markdown code fences
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  // Try to find JSON array in the response
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    jsonStr = arrayMatch[0];
  }

  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) {
    throw new Error('AI 返回格式错误：不是数组');
  }

  return parsed
    .map((item): ExtractedTransaction => ({
      name: String(item.name || '未知'),
      amount: Math.abs(Number(item.amount) || 0),
      date: item.date || new Date().toISOString().split('T')[0],
      type: item.type === 'income' ? 'income' : 'expense',
      categoryName: validateCategory(item.categoryName),
      paymentMethod: item.paymentMethod || undefined,
      description: item.description || undefined,
    }))
    .filter(t => t.amount > 0);
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

  const body = {
    model: provider.modelName,
    stream: !!onStream,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT_MULTI },
          ...imageContents,
        ],
      },
    ],
    max_tokens: 4000,
    temperature: 0.1,
  };

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errorText}`);
  }

  // Streaming mode
  if (onStream && response.body) {
    try {
      const reader = response.body.getReader();
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

      return parseAIResponse(fullText);
    } catch {
      // Fallback: ReadableStream not supported, read full response
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content
        || data.choices?.[0]?.message?.reasoning_content
        || '';
      if (content) onStream(content, content);
      return parseAIResponse(content);
    }
  }

  // Non-streaming mode
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content
    || data.choices?.[0]?.message?.reasoning_content
    || '';
  if (!content) throw new Error('AI 返回内容为空');
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
