import type { Folder } from './service';

export interface FolderOption {
  label: string;
  value: number;
}

/** 把目录树摊平成下拉选项，标签带上级路径，如「故事 / 米小圈」。 */
export function flattenFolders(nodes: Folder[], prefix = ''): FolderOption[] {
  const result: FolderOption[] = [];
  for (const node of nodes) {
    const label = prefix ? `${prefix} / ${node.name}` : node.name;
    result.push({ label, value: node.id });
    if (node.children?.length) {
      result.push(...flattenFolders(node.children, label));
    }
  }
  return result;
}

/** 按名称过滤目录树：节点自己匹配，或者有子孙匹配，都保留。 */
export function filterFolderTree(nodes: Folder[], text: string): Folder[] {
  const keyword = text.trim().toLowerCase();
  if (!keyword) {
    return nodes;
  }
  return nodes.reduce<Folder[]>((result, node) => {
    const children = filterFolderTree(node.children || [], text);
    if (node.name.toLowerCase().includes(keyword) || children.length) {
      result.push({ ...node, children });
    }
    return result;
  }, []);
}

export function findFolder(nodes: Folder[], id: number): Folder | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const child = findFolder(node.children || [], id);
    if (child) {
      return child;
    }
  }
  return null;
}

/** 逗号分隔的标签文本转数组。 */
export function parseTags(text: string | undefined): string[] {
  if (!text) {
    return [];
  }
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** 顺序输入：空白表示不设置（null）；不是数字返回 undefined 表示非法。 */
export function parseSortNo(
  text: string | undefined,
): number | null | undefined {
  const value = (text ?? '').trim();
  if (value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}
