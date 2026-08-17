// Object storage is kept behind an interface for the same reason as BibleProvider —
// docs/02-ARCHITECTURE.md calls for signed-URL-compatible storage without vendor
// lock-in. Clients never upload through the API server itself; they PUT directly
// to the signed URL, then tell the API the upload is done via MediaService.confirm.
export interface UploadTarget {
  uploadUrl: string;   // client PUTs the file bytes here directly
  storageKey: string;  // opaque key the API remembers to build the public URL later
  publicUrl: string;   // where the file will be readable once uploaded
}

export interface StorageProvider {
  createUploadUrl(userId: string, contentType: string, extension: string): Promise<UploadTarget>;
}
