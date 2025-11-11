import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabaseClient';

describe('Database Connection', () => {
  it('should connect to the database and fetch data', async () => {
    const { data, error } = await supabase.from('perfiles').select('*').limit(1);
    expect(error).toBeNull();
    expect(data).toBeInstanceOf(Array);
  });
});
