import { useIntl } from '@umijs/max';

/** 取当前语言的文案。values 用来替换 {name} 这类占位。 */
export function useT() {
  const intl = useIntl();
  return (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);
}
