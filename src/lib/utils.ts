type ClassValue = string | false | null | undefined;

/**
 * Junta classes truthy. Para utilitários aditivos no `className`;
 * não resolve conflitos de Tailwind como o tailwind-merge.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
