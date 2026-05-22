import { supabase } from './supabase';

export async function invokeFunction<T = unknown>(
  name: string,
  payload?: unknown,
): Promise<{ data?: T; error?: string }> {
  const { data, error } = await supabase.functions.invoke(name, {
    body: payload ?? {},
  });
  if (error) return { error: error.message };
  return { data: data as T };
}
