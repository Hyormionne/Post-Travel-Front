// 페이지 이동 시에도 Object URL이 유지되도록 모듈 레벨 Map에 보관.
// PhotoUploadPage → MetadataPage 이동 후에도 대표사진 미리보기 표시 가능.
const _cache = new Map<string, string>(); // photoId → objectURL

export const photoCache = {
  set(id: string, url: string) {
    _cache.set(id, url);
  },
  get(id: string): string | undefined {
    return _cache.get(id);
  },
  delete(id: string) {
    const url = _cache.get(id);
    if (url) URL.revokeObjectURL(url);
    _cache.delete(id);
  },
  clear() {
    _cache.forEach((url) => URL.revokeObjectURL(url));
    _cache.clear();
  },
  ids(): string[] {
    return Array.from(_cache.keys());
  },
};
