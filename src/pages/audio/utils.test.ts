import { describe, expect, it } from 'vitest';
import type { Folder } from './service';
import {
  filterFolderTree,
  findFolder,
  flattenFolders,
  parseSortNo,
  parseTags,
} from './utils';

const tree: Folder[] = [
  {
    id: 1,
    parentId: null,
    name: '故事',
    sort: 0,
    children: [
      { id: 3, parentId: 1, name: '米小圈', sort: 0, children: [] },
      { id: 4, parentId: 1, name: '佩奇', sort: 1, children: [] },
    ],
  },
  { id: 2, parentId: null, name: '音乐', sort: 1, children: [] },
];

describe('audio utils', () => {
  it('flattenFolders：标签带上级路径', () => {
    expect(flattenFolders(tree)).toEqual([
      { label: '故事', value: 1 },
      { label: '故事 / 米小圈', value: 3 },
      { label: '故事 / 佩奇', value: 4 },
      { label: '音乐', value: 2 },
    ]);
  });

  it('filterFolderTree：子孙匹配时保留父级，只保留匹配的子级', () => {
    const result = filterFolderTree(tree, '米小');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('故事');
    expect(result[0].children?.map((node) => node.name)).toEqual(['米小圈']);
  });

  it('filterFolderTree：空关键字返回原树', () => {
    expect(filterFolderTree(tree, '  ')).toBe(tree);
  });

  it('findFolder：能找到深层节点，找不到返回 null', () => {
    expect(findFolder(tree, 4)?.name).toBe('佩奇');
    expect(findFolder(tree, 99)).toBeNull();
  });

  it('parseTags：去空格去空项', () => {
    expect(parseTags('a, b,,c ')).toEqual(['a', 'b', 'c']);
    expect(parseTags('')).toEqual([]);
    expect(parseTags(undefined)).toEqual([]);
  });

  it('parseSortNo：空白是 null，数字转数字，其他非法', () => {
    expect(parseSortNo('')).toBeNull();
    expect(parseSortNo('  ')).toBeNull();
    expect(parseSortNo('12')).toBe(12);
    expect(parseSortNo('abc')).toBeUndefined();
  });
});
