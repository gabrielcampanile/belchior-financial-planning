import type { CategorizationRule, TransactionType } from "./types";

/** Normaliza texto: minúsculo, sem acentos, espaços colapsados. */
export function normalize(text: string): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export interface RuleMatch {
  categoryId: string | null;
  type: TransactionType;
  ruleId: string;
}

function matches(rule: CategorizationRule, description: string): boolean {
  const target = normalize(rule.pattern);
  if (!target) return false;
  switch (rule.match_type) {
    case "CONTAINS":
      return description.includes(target);
    case "STARTS_WITH":
      return description.startsWith(target);
    case "EQUALS":
      return description === target;
    case "REGEX":
      try {
        return new RegExp(rule.pattern, "i").test(description);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Aplica as regras em ordem de prioridade (menor número = maior prioridade).
 * Retorna a primeira regra que casar, ou null.
 */
export function applyRules(description: string, rules: CategorizationRule[]): RuleMatch | null {
  const desc = normalize(description);
  const ordered = [...rules]
    .filter((r) => r.enabled)
    .sort((a, b) => a.priority - b.priority || a.pattern.localeCompare(b.pattern));
  for (const rule of ordered) {
    if (matches(rule, desc)) {
      return { categoryId: rule.category_id, type: rule.target_type, ruleId: rule.id };
    }
  }
  return null;
}
