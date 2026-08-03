export type UploadResult = {
  ok: boolean;
  asset?: {
    id: string;
    originalName: string;
    filename: string;
  };
  error?: string;
  fileName: string;
};

export async function uploadAssets(submissionId: string, files: FileList | File[]) {
  const list = Array.from(files);
  const results: UploadResult[] = [];

  for (const file of list) {
    const upload = new FormData();
    upload.set("submissionId", submissionId);
    upload.set("file", file);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: upload });
      const data = await res.json();
      if (!res.ok) {
        results.push({
          ok: false,
          fileName: file.name,
          error: data.error || "Upload failed.",
        });
        continue;
      }
      results.push({
        ok: true,
        fileName: file.name,
        asset: {
          id: data.asset.id,
          originalName: data.asset.originalName,
          filename: data.asset.filename,
        },
      });
    } catch {
      results.push({
        ok: false,
        fileName: file.name,
        error: "Network error.",
      });
    }
  }

  const failed = results.filter((r) => !r.ok);
  return {
    results,
    failed,
    succeeded: results.filter((r) => r.ok),
    errorMessage:
      failed.length > 0
        ? `Could not upload: ${failed.map((f) => f.fileName).join(", ")}.`
        : "",
  };
}
