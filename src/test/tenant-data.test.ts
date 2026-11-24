import { describe, it, expect } from 'vitest';
import { getShopData, getShopBySlug } from '@/lib/demo-data';
describe('Dados isolados da barbearia demonstrativa',()=>{
 it('cada coleção retornada pertence exclusivamente à barbearia solicitada',()=>{
  const data=getShopData('shop-1');
  for(const list of [data.clients,data.services,data.barbers,data.appointments,data.expenses]) {
   expect(list.length).toBeGreaterThan(0);
   expect(list.every(row=>row.shopId==='shop-1')).toBe(true);
  }
 });
 it('não retorna dados de outra barbearia para identificador desconhecido',()=>{
  expect(()=>getShopData('outra-barbearia')).toThrow('Barbearia não encontrada');
 });
 it('não encontra uma página pública com identificador desconhecido',()=>{
  expect(getShopBySlug('outra-barbearia')).toBeUndefined();
 });
});
