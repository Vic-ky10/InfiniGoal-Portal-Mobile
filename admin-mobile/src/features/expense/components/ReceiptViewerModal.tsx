import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Linking,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText } from "@/components/ui";
import { toast } from "@/store/toast.store";

interface Props {
  visible: boolean;
  receiptUrl: string | null;
  receiptName?: string | null;
  receiptType?: string | null;
  onClose: () => void;
}

export default function ReceiptViewerModal({
  visible,
  receiptUrl,
  receiptName,
  receiptType,
  onClose,
}: Props) {
  if (!visible || !receiptUrl) return null;

  const isPdf =
    receiptType?.includes("pdf") ||
    receiptUrl.toLowerCase().endsWith(".pdf") ||
    receiptName?.toLowerCase().endsWith(".pdf");

  const handleOpenExternal = () => {
    Linking.openURL(receiptUrl).catch(() => {
      toast.error("Unable to open receipt.");
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        {/* TOP BAR */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Feather name={isPdf ? "file-text" : "image"} size={18} color="#FFFFFF" />
            <AppText weight="700" variant="body" color="#FFFFFF" numberOfLines={1}>
              {receiptName || (isPdf ? "Receipt.pdf" : "Receipt.jpg")}
            </AppText>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleOpenExternal} style={styles.iconBtn}>
              <Feather name="external-link" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Feather name="x" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENT AREA */}
        <View style={styles.content}>
          {isPdf ? (
            <View style={styles.pdfContainer}>
              <Feather name="file-text" size={64} color="#60A5FA" />
              <AppText weight="700" variant="h3" color="#FFFFFF" style={{ marginTop: 16 }}>
                PDF Document Attached
              </AppText>
              <AppText variant="caption" color="#9CA3AF" style={{ marginTop: 8, textAlign: "center" }}>
                {receiptName || "Receipt.pdf"}
              </AppText>

              <TouchableOpacity onPress={handleOpenExternal} style={styles.openPdfBtn}>
                <Feather name="book-open" size={16} color="#FFFFFF" />
                <AppText weight="700" variant="body" color="#FFFFFF" style={{ marginLeft: 8 }}>
                  Open PDF Viewer
                </AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <Image source={{ uri: receiptUrl }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  pdfContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  openPdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
});
