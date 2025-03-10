import { supabase } from './supabase';  
import { Operator } from './supabase';
import { cacheManager } from './cache';

// Constante para configuração do cache
const CACHE_DURATION = 60 * 1000; // 1 minuto

export const getOperators = async (): Promise<{ data: Operator[] | null; error: any }> => {
  // Verificar cache primeiro
  const cacheKey = 'operators_list';
  const cachedData = cacheManager.get<Operator[]>(cacheKey, CACHE_DURATION);
  
  if (cachedData) {
    console.log('Usando dados de operadores do cache');
    return { data: cachedData, error: null };
  }
  
  try {
    console.log('Buscando operadores do banco de dados');
    const { data, error } = await supabase
      .from('operators')
      .select(`
        *,
        trucks!fk_operators_truck(name),
        projects(name)
      `);
    
    if (error) throw error;
    
    // Transformar os dados para corresponder ao tipo Operator
    const formattedData = data.map(item => ({
      id: item.id,
      name: item.name,
      login: item.login,
      password: item.password,
      phone: item.phone,
      truck_id: item.truck_id,
      project_id: item.project_id,
      created_at: item.created_at,
      truck: item.trucks && item.trucks.length > 0 ? { name: item.trucks[0].name } : undefined,
      project: item.projects && item.projects.length > 0 ? { name: item.projects[0].name } : undefined
    }));
    
    // Armazenar no cache
    cacheManager.set(cacheKey, formattedData);
    
    return { data: formattedData, error: null };
  } catch (error) {
    console.error("Erro ao buscar operadores:", error);
    return { data: null, error };
  }
};

export const checkLoginExists = async (login: string) => {
  const { data } = await supabase
    .from('operators')
    .select('id')
    .eq('login', login)
    .maybeSingle();

  return !!data;
};

export const createOperator = async (operator: any) => {
  try {
    // Recebe só o objeto e faz insert
    const { data, error } = await supabase
      .from('operators')
      .insert([operator])
      .select(); // Adicionar select para retornar os dados inseridos
    
    // Invalidar o cache após criar um operador
    cacheManager.invalidate('operators_list');
    
    console.log('Operador criado:', data);
    return { data, error };
  } catch (e) {
    console.error('Erro ao criar operador:', e);
    return { data: null, error: e };
  }
};

export const updateOperator = async (id: number, operator: any) => {
  try {
    // Recebe id e objeto
    const { data, error } = await supabase
      .from('operators')
      .update(operator)
      .eq('id', id)
      .select(); // Adicionar select para retornar os dados atualizados
    
    // Invalidar o cache após atualizar um operador
    cacheManager.invalidate('operators_list');
    
    console.log('Operador atualizado:', data);
    return { data, error };
  } catch (e) {
    console.error('Erro ao atualizar operador:', e);
    return { data: null, error: e };
  }
};

export const deleteOperator = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('operators')
      .delete()
      .eq('id', id)
      .select();
    
    // Invalidar o cache após excluir um operador
    cacheManager.invalidate('operators_list');
    
    return { data, error };
  } catch (e) {
    console.error('Erro ao excluir operador:', e);
    return { data: null, error: e };
  }
};
