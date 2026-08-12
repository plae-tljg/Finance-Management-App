import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  isDefault: boolean;
}

const STORAGE_KEY = '@ai_providers';

function getSeedProviders(): AIProvider[] {
  const extra = Constants.expoConfig?.extra || {};
  const providers: AIProvider[] = [];

  if (extra.MIMO_API_KEY) {
    providers.push({
      id: 'seed_mimo',
      name: '小米 MiMo',
      baseUrl: 'https://token-plan-sgp.xiaomimimo.com/v1',
      apiKey: extra.MIMO_API_KEY,
      modelName: 'mimo-v2.5',
      isDefault: true,
    });
  }

  if (extra.MINIMAX_API_KEY) {
    providers.push({
      id: 'seed_minimax',
      name: 'MiniMax',
      baseUrl: 'https://api.minimax.io/v1',
      apiKey: extra.MINIMAX_API_KEY,
      modelName: 'MiniMax-M3',
      isDefault: providers.length === 0,
    });
  }

  return providers;
}

export async function getProviders(): Promise<AIProvider[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = getSeedProviders();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as AIProvider[];
}

export async function saveProviders(providers: AIProvider[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
}

export async function addProvider(provider: AIProvider): Promise<void> {
  const providers = await getProviders();
  providers.push(provider);
  await saveProviders(providers);
}

export async function updateProvider(id: string, updates: Partial<AIProvider>): Promise<void> {
  const providers = await getProviders();
  const idx = providers.findIndex(p => p.id === id);
  if (idx === -1) return;
  providers[idx] = { ...providers[idx], ...updates };
  await saveProviders(providers);
}

export async function deleteProvider(id: string): Promise<void> {
  const providers = await getProviders();
  const filtered = providers.filter(p => p.id !== id);
  // If we deleted the default, make the first remaining one default
  if (filtered.length > 0 && !filtered.some(p => p.isDefault)) {
    filtered[0].isDefault = true;
  }
  await saveProviders(filtered);
}

export async function getDefaultProvider(): Promise<AIProvider | null> {
  const providers = await getProviders();
  return providers.find(p => p.isDefault) || providers[0] || null;
}

export async function setDefaultProvider(id: string): Promise<void> {
  const providers = await getProviders();
  for (const p of providers) {
    p.isDefault = p.id === id;
  }
  await saveProviders(providers);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
