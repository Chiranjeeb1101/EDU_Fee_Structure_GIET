import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Platform, Modal, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const DocumentCard = ({ item, onPreview }: any) => (
  <TouchableOpacity style={styles.docCard} activeOpacity={0.8} onPress={() => onPreview(item)}>
    <View style={styles.docLeft}>
      <View style={styles.docIconWrapper}>
        <MaterialIcons name={item.icon} size={36} color={colors.tertiary} />
        {item.isNew && <View style={styles.docIconDot} />}
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.docMetaRow}>
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
          )}
          <Text style={styles.docMetaText}>{item.format} • {item.size}</Text>
        </View>
      </View>
    </View>
    <TouchableOpacity style={styles.downloadBtn} onPress={() => Alert.alert('Download', `Downloading ${item.title}...`)}>
      <MaterialIcons name="download" size={20} color="#000" />
      <Text style={styles.downloadText}>Download</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const MOCK_DOCS = [
  { id: '1', title: "Semester 3 Marksheet", format: "PDF", size: "1.2 MB", icon: "description", isVerified: true, isNew: false },
  { id: '2', title: "Bonafide Certificate", format: "PDF", size: "850 KB", icon: "verified-user", isVerified: false, isNew: true },
  { id: '3', title: "Exam Registration Form", format: "PDF", size: "2.1 MB", icon: "edit-document", isVerified: false, isNew: true },
];

export const DocumentsScreen = () => {
  const navigation = useNavigation();
  const [documents, setDocuments] = useState(MOCK_DOCS);
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const handleUpload = () => {
    Alert.alert(
      "Upload Document",
      "Select a document type to upload.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Upload ID Proof", 
          onPress: () => {
            const newDoc = {
              id: Math.random().toString(),
              title: "Student ID Proof",
              format: "JPG",
              size: "3.4 MB",
              icon: "badge",
              isVerified: false,
              isNew: true
            };
            setDocuments([newDoc, ...documents]);
            Alert.alert("Success", "Document uploaded successfully!");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Decor */}
      <View style={styles.bgDecorCircle1} />
      <View style={styles.bgDecorCircle2} />

      <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Dashboard' })} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Documents</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleUpload}>
                <MaterialIcons name="file-upload" size={24} color={colors.tertiary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <MaterialIcons name="search" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubtitle}>VAULT STORAGE</Text>
            <Text style={styles.sectionTitle}>Academic Documents</Text>
          </View>

          <View style={styles.docList}>
            {documents.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No documents uploaded.</Text>
            ) : (
              documents.map(doc => (
                <DocumentCard 
                  key={doc.id} 
                  item={doc}
                  onPreview={setPreviewDoc}
                />
              ))
            )}
          </View>

          {/* Storage Status */}
          <View style={styles.storageCard}>
             <View style={styles.storageContent}>
               <Text style={styles.storageTitle}>Storage Status</Text>
               <Text style={styles.storageDesc}>You have used 4.2 MB of your secure 50 MB document vault.</Text>
               
               <View style={styles.progressTrack}>
                 <View style={[styles.progressFill, { width: '8.4%' }]} />
               </View>
               <Text style={styles.progressText}>8.4% CAPACITY UTILIZED</Text>
             </View>
             
             <MaterialIcons name="folder-open" size={150} color={colors.primary} style={styles.storageBgIcon} />
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Preview Modal */}
      <Modal visible={!!previewDoc} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Document Preview</Text>
              <TouchableOpacity onPress={() => setPreviewDoc(null)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {previewDoc && (
              <View style={styles.previewBody}>
                <MaterialIcons name={previewDoc.icon} size={80} color={colors.primary} style={{ marginBottom: 16 }} />
                <Text style={styles.previewTitle}>{previewDoc.title}</Text>
                <Text style={styles.previewMeta}>{previewDoc.format} • {previewDoc.size}</Text>
                
                {previewDoc.isVerified && (
                  <View style={[styles.verifiedBadge, { marginTop: 12 }]}>
                    <Text style={styles.verifiedText}>OFFICIALLY VERIFIED</Text>
                  </View>
                )}
                
                <View style={styles.previewPlaceholder}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Preview not available for this format.</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e1c' },
  safeArea: { flex: 1 },
  bgDecorCircle1: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(49, 107, 243, 0.1)',
    zIndex: 0,
  },
  bgDecorCircle2: {
    position: 'absolute',
    bottom: '10%',
    right: '-10%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(175, 136, 255, 0.05)',
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: Platform.OS === 'android' ? 80 : 64,
    paddingTop: Platform.OS === 'android' ? 30 : 10,
    backgroundColor: 'rgba(9, 14, 28, 0.8)',
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(144, 171, 255, 0.1)',
    borderRadius: 20,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionSubtitle: {
    color: '#316bf3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  docList: {
    gap: 16,
    marginBottom: 40,
  },
  docCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'column',
    gap: 16,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIconWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  docIconDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.tertiary,
    shadowColor: colors.tertiary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(71, 196, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    color: colors.tertiary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  docMetaText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  downloadBtn: {
    backgroundColor: colors.tertiary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: colors.tertiary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  downloadText: {
    color: '#000',
    fontWeight: '800',
    marginLeft: 8,
    fontSize: 14,
  },
  storageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 32,
    padding: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  storageContent: {
    zIndex: 10,
  },
  storageTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  storageDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 24,
    maxWidth: '80%',
    lineHeight: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#1e253b',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  storageBgIcon: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    opacity: 0.1,
    transform: [{ rotate: '12deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 14, 28, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#13192b',
    borderRadius: 24,
    width: '100%',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  previewBody: {
    alignItems: 'center',
  },
  previewTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  previewMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  previewPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
});
