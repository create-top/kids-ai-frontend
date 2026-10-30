import { CORE_BASE, coreFetch, jsonBody } from '@/services/http';

export interface Folder {
  id: number;
  parentId: number | null;
  name: string;
  sort: number;
  children?: Folder[];
}

export interface AudioItem {
  id: number;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  folderId?: number | null;
  category?: string;
  tags?: string[];
  sortNo?: number | null;
}

export interface AudioPage {
  records: AudioItem[];
  total: number;
}

export interface AudioQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  folderId?: number | null;
  uncategorized?: boolean;
}

export interface AudioUpdate {
  title: string;
  description: string;
  category: string;
  tags: string[];
  sortNo: number | null;
}

export function fetchFolderTree(): Promise<Folder[]> {
  return coreFetch<Folder[]>('/api/v1/audio-folders/tree');
}

export function createFolder(
  parentId: number | null,
  name: string,
): Promise<Folder> {
  return coreFetch<Folder>('/api/v1/audio-folders', {
    method: 'POST',
    ...jsonBody({ parentId, name }),
  });
}

export function renameFolder(id: number, name: string): Promise<Folder> {
  return coreFetch<Folder>(`/api/v1/audio-folders/${id}`, {
    method: 'PATCH',
    ...jsonBody({ name }),
  });
}

export function moveFolder(
  id: number,
  parentId: number | null,
): Promise<Folder> {
  return coreFetch<Folder>(`/api/v1/audio-folders/${id}/move`, {
    method: 'POST',
    ...jsonBody({ parentId }),
  });
}

export function deleteFolder(id: number): Promise<void> {
  return coreFetch<void>(`/api/v1/audio-folders/${id}`, { method: 'DELETE' });
}

export function fetchAudios(query: AudioQuery): Promise<AudioPage> {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.keyword?.trim()) {
    params.set('keyword', query.keyword.trim());
  }
  // 「未归类」和「某个目录」互斥，未归类优先
  if (query.uncategorized) {
    params.set('uncategorized', 'true');
  } else if (query.folderId) {
    params.set('folderId', String(query.folderId));
  }
  return coreFetch<AudioPage>(`/api/v1/audios?${params.toString()}`);
}

export function uploadAudio(form: FormData): Promise<AudioItem> {
  return coreFetch<AudioItem>('/api/v1/audios/upload', {
    method: 'POST',
    body: form,
  });
}

export function updateAudio(
  id: number,
  update: AudioUpdate,
): Promise<AudioItem> {
  return coreFetch<AudioItem>(`/api/v1/audios/${id}`, {
    method: 'PATCH',
    // WHY updateSort：sortNo 为空表示「清掉手动顺序」，要和「没传」区分，由服务端按这个开关决定是否写入。
    ...jsonBody({ ...update, updateSort: true }),
  });
}

export function moveAudio(
  id: number,
  folderId: number | null,
): Promise<AudioItem> {
  return coreFetch<AudioItem>(`/api/v1/audios/${id}`, {
    method: 'PATCH',
    // WHY updateFolder：folderId 为 null 表示「移出目录」，同样要显式声明。
    ...jsonBody({ updateFolder: true, folderId }),
  });
}

export function deleteAudio(id: number): Promise<void> {
  return coreFetch<void>(`/api/v1/audios/${id}`, { method: 'DELETE' });
}

/** 试听地址，直接给 <audio> 使用，浏览器会带 Range 请求。 */
export function audioContentUrl(id: number): string {
  return `${CORE_BASE}/api/v1/audios/${id}/content`;
}
