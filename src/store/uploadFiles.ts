// 업로드 흐름에서 선택한 File 객체를 페이지 간 전달하기 위한 인메모리 store.
// File은 직렬화 불가하므로 sessionStorage 대신 모듈 스코프에 보관.
const fileMap = new Map<string, File>();

export function storeFiles(files: { id: string; file: File }[]) {
  fileMap.clear();
  for (const { id, file } of files) {
    fileMap.set(id, file);
  }
}

export function getStoredFiles(): Map<string, File> {
  return fileMap;
}

export function clearStoredFiles() {
  fileMap.clear();
}
