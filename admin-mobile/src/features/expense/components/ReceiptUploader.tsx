import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Linking,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { AppText, Button } from "@/components/ui";
import { useThemeColors, radius, spacing, shadows } from "@/theme";
import { toast } from "@/store/toast.store";
import { uploadReceipt, ReceiptFile, UploadReceiptResult } from "@/lib/storage/uploadReceipt";

interface Props {
  employeeId: string;
  expenseId?: string;
  receiptUrl?: string | null;
  receiptName?: string | null;
  receiptType?: string | null;
  onReceiptChanged: (info: {
    url: string | null;
    name: string | null;
    size: number | null;
    type: string | null;
  }) => void;
  onPreviewPress?: (url: string, type?: string) => void;
}

export default function ReceiptUploader({
  employeeId,
  expenseId,
  receiptUrl,
  receiptName,
  receiptType,
  onReceiptChanged,
  onPreviewPress,
}: Props) {
  const colors = useThemeColors();
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const isPdf =
    receiptType?.includes("pdf") ||
    receiptUrl?.toLowerCase().endsWith(".pdf") ||
    receiptName?.toLowerCase().endsWith(".pdf");

  const handleFileProcess = async (file: ReceiptFile) => {
    if (!employeeId) {
      toast.error("Employee profile missing. Cannot upload receipt.");
      return;
    }
    setUploading(true);
    try {
      const result: UploadReceiptResult | null = await uploadReceipt(employeeId, file, expenseId);
      if (result) {
        onReceiptChanged({
          url: result.publicUrl,
          name: result.fileName,
          size: result.fileSize,
          type: result.fileType,
        });
      }
    } catch (err: any) {
      toast.error("Failed to upload receipt file.");
    } finally {
      setUploading(false);
    }
  };

  const handleCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast.error("Camera permission is required to capture photos.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        const name = asset.fileName || `photo_${Date.now()}.jpg`;
        await handleFileProcess({
          uri: asset.uri,
          name,
          size: asset.fileSize,
          type: asset.mimeType || "image/jpeg",
        });
      }
    } catch (err: any) {
      toast.error("Failed to open camera.");
    }
  };

  const handleGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.error("Gallery permission is required to select photos.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        const name = asset.fileName || `image_${Date.now()}.jpg`;
        await handleFileProcess({
          uri: asset.uri,
          name,
          size: asset.fileSize,
          type: asset.mimeType || "image/jpeg",
        });
      }
    } catch (err: any) {
      toast.error("Failed to select image from gallery.");
    }
  };

  const handleDocumentPicker = async () => {
    if (Platform.OS === "web") {
      triggerWebFileInput();
      return;
    }
    // On Native mobile, use Image Library as file picker or HTML input
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        // eslint-disable-next-line react-hooks/purity
        const name = asset.fileName || `doc_${Date.now()}`;
        await handleFileProcess({
          uri: asset.uri,
          name,
          size: asset.fileSize,
          type: asset.mimeType,
        });
      }
    } catch (err: any) {
      toast.error("Failed to select document.");
    }
  };

  const triggerWebFileInput = () => {
    if (Platform.OS !== "web") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleFileProcess({
          uri: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
        });
      }
    };
    input.click();
  };

  const handleRemove = () => {
    onReceiptChanged({
      url: null,
      name: null,
      size: null,
      type: null,
    });
    toast.success("Receipt removed.");
  };

  const handleOpenPdf = () => {
    if (!receiptUrl) return;
    if (onPreviewPress) {
      onPreviewPress(receiptUrl, "application/pdf");
    } else {
      Linking.openURL(receiptUrl).catch(() => {
        toast.error("Unable to open PDF link.");
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Feather name="paperclip" size={16} color={colors.primary} />
        <AppText weight="700" variant="body" color={colors.text}>
          Receipt / Bill
        </AppText>
      </View>

      {uploading ? (
        <View style={[styles.card, styles.uploadingCard, { borderColor: colors.primary, backgroundColor: `${colors.primary}08` }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <AppText variant="caption" weight="600" color={colors.primary} style={{ marginTop: spacing.xs }}>
            Uploading receipt...
          </AppText>
        </View>
      ) : receiptUrl ? (
        /* AFTER UPLOAD PREVIEW CARD */
        <View style={[styles.previewCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.previewInfoRow}>
            {isPdf ? (
              <View style={[styles.pdfBadge, { backgroundColor: "#EFF6FF" }]}>
                <Feather name="file-text" size={24} color="#2563EB" />
              </View>
            ) : (
              <Image source={{ uri: receiptUrl }} style={styles.thumbnail} resizeMode="cover" />
            )}

            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <AppText weight="600" variant="caption" color={colors.text} numberOfLines={1}>
                {receiptName || (isPdf ? "Receipt.pdf" : "Receipt.jpg")}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={{ fontSize: 11 }}>
                {isPdf ? "PDF Document" : "Image File"} • Attached
              </AppText>
            </View>
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity
              onPress={() => (isPdf ? handleOpenPdf() : onPreviewPress ? onPreviewPress(receiptUrl, "image") : Linking.openURL(receiptUrl))}
              style={[styles.actionBtn, { backgroundColor: `${colors.primary}12` }]}
            >
              <Feather name={isPdf ? "external-link" : "eye"} size={13} color={colors.primary} />
              <AppText variant="caption" weight="600" color={colors.primary} style={styles.actionText}>
                {isPdf ? "Open" : "Preview"}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGallery} style={[styles.actionBtn, { backgroundColor: `${colors.textSecondary}15` }]}>
              <Feather name="refresh-cw" size={13} color={colors.textSecondary} />
              <AppText variant="caption" weight="600" color={colors.textSecondary} style={styles.actionText}>
                Replace
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRemove} style={[styles.actionBtn, { backgroundColor: "#FEF2F2" }]}>
              <Feather name="trash-2" size={13} color="#EF4444" />
              <AppText variant="caption" weight="600" color="#EF4444" style={styles.actionText}>
                Remove
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* UPLOAD PICKER CARD */
        <View style={[styles.card, { borderColor: isDragOver ? colors.primary : colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={triggerWebFileInput} style={styles.uploadPrompt}>
            <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="upload-cloud" size={22} color={colors.primary} />
            </View>
            <AppText weight="700" variant="body" color={colors.text} style={{ marginTop: spacing.xs }}>
              + Upload Receipt
            </AppText>
            {Platform.OS === "web" ? (
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                Drag & Drop or Click to Browse
              </AppText>
            ) : null}
          </TouchableOpacity>

          {/* Action Buttons Row */}
          <View style={styles.buttonsRow}>
            {Platform.OS !== "web" ? (
              <TouchableOpacity onPress={handleCamera} style={[styles.pickerBtn, { backgroundColor: `${colors.primary}08` }]}>
                <Feather name="camera" size={14} color={colors.primary} />
                <AppText variant="caption" weight="600" color={colors.primary}>
                  Camera
                </AppText>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={handleGallery} style={[styles.pickerBtn, { backgroundColor: `${colors.primary}08` }]}>
              <Feather name="image" size={14} color={colors.primary} />
              <AppText variant="caption" weight="600" color={colors.primary}>
                Gallery
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDocumentPicker} style={[styles.pickerBtn, { backgroundColor: `${colors.primary}08` }]}>
              <Feather name="file" size={14} color={colors.primary} />
              <AppText variant="caption" weight="600" color={colors.primary}>
                Document
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <AppText variant="caption" color={colors.textSecondary} style={{ fontSize: 11 }}>
              Supported: JPG • PNG • PDF | Max: 10 MB
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={{ fontSize: 11, fontStyle: "italic" }}>
              No file selected
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  card: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  uploadingCard: {
    paddingVertical: spacing.lg,
    justifyContent: "center",
  },
  uploadPrompt: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
    marginVertical: spacing.xs,
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  footerNote: {
    alignItems: "center",
    marginTop: spacing.xs,
    gap: 2,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    ...shadows.sm,
  },
  previewInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  pdfBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  previewActions: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  actionText: {
    fontSize: 12,
  },
});
