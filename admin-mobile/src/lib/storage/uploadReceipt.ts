import { Platform } from "react-native";
import { File as ExpoFile } from "expo-file-system";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/store/toast.store";

export interface ReceiptFile {
  uri: string;
  name: string;
  size?: number;
  type?: string;
  file?: File; // Web Native File object
}

export interface UploadReceiptResult {
  publicUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"];

export async function uploadReceipt(
  employeeId: string,
  receipt: ReceiptFile,
  expenseId?: string
): Promise<UploadReceiptResult | null> {
  try {
    
    let ext = receipt.name.split(".").pop()?.toLowerCase() || "";
    if (!ext && receipt.uri) {
      ext = receipt.uri.split(".").pop()?.split("?")[0].toLowerCase() || "jpg";
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error("Unsupported file type. Only JPG, PNG, and PDF are allowed.");
      return null;
    }

    let mimeType = receipt.type;
    if (!mimeType) {
      if (ext === "pdf") mimeType = "application/pdf";
      else if (ext === "png") mimeType = "image/png";
      else mimeType = "image/jpeg";
    }

    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase()) && !ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error("Unsupported file format. Please upload JPG, PNG or PDF.");
      return null;
    }

    // . Prepare file data and check size
    let uploadBody: ArrayBuffer | Blob | File;
    let computedSize = receipt.size || 0;

    if (Platform.OS === "web" && receipt.file) {
      uploadBody = receipt.file;
      computedSize = receipt.file.size;
    } else if (Platform.OS === "web" && receipt.uri.startsWith("data:")) {
      const res = await fetch(receipt.uri);
      const blob = await res.blob();
      uploadBody = blob;
      computedSize = blob.size;
    } else {
      try {
        const expoFile = new ExpoFile(receipt.uri);
        const arrayBuffer = await expoFile.arrayBuffer();
        uploadBody = arrayBuffer;
        computedSize = arrayBuffer.byteLength;
      } catch {
        // Fallback fetch for web or native URIs
        const res = await fetch(receipt.uri);
        const blob = await res.blob();
        uploadBody = blob;
        computedSize = blob.size;
      }
    }

    if (computedSize > MAX_FILE_SIZE) {
      toast.error("File size exceeds 10 MB limit.");
      return null;
    }

    //  Construct storage path
    const folder = expenseId || `draft-${Date.now()}`;
    const cleanFileName = receipt.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${employeeId}/${folder}/${Date.now()}_${cleanFileName}`;

    // .Upload to Supabase Storage bucket 'expense-receipts'
    const { error: uploadError } = await supabase.storage
      .from("expense-receipts")
      .upload(filePath, uploadBody, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      toast.error(`Upload failed: ${uploadError.message}`);
      return null;
    }

    //  Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from("expense-receipts")
      .getPublicUrl(filePath);

    toast.success("Receipt uploaded successfully!");

    return {
      publicUrl: publicUrlData.publicUrl,
      fileName: receipt.name,
      fileSize: computedSize,
      fileType: mimeType,
    };
  } catch (err: any) {
    console.error("Receipt upload error:", err);
    toast.error("Network or storage failure while uploading receipt.");
    return null;
  }
}
