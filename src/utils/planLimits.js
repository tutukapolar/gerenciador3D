import { PLAN_LIMITS } from '../constants/plans';

// Verifica se atingiu o limite de cadastro
export function canCreateItem(userPlan = 'FREE', currentCount, resourceType) {
  const limit = PLAN_LIMITS[userPlan]?.[resourceType] ?? 0;
  return currentCount < limit;
}

// Filtra as opções da calculadora de acordo com o plano
export function filterCalculatorResults(userPlan = 'FREE', calculations) {
  const allowed = PLAN_LIMITS[userPlan]?.allowedChannels || [];
  
  if (allowed.includes('*')) return calculations;

  return Object.keys(calculations)
    .filter((key) => allowed.includes(key))
    .reduce((obj, key) => {
      obj[key] = calculations[key];
      return obj;
    }, {});
}