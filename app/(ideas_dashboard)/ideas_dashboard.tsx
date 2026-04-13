import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/firebaseConfig';
import { SuggestionItem } from '@/models/suggestion';
import { fetchSuggestions } from '@/services/suggestionService';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../ThemeContext';

export default function IdeasDashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [filter, setFilter] = useState<'Popular' | 'Newest'>('Popular');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [commentLikes, setCommentLikes] = useState<string[]>([]);

  const [likingId, setLikingId] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionItem | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  const loadSuggestions = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      const data = await fetchSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.log('FETCH ERROR:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadSuggestions(); }, []));

  useEffect(() => {
    if (selectedSuggestion?.id && commentModalVisible) {
      setCommentsLoading(true);
      const commentsRef = collection(db, 'suggestions', selectedSuggestion.id, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCommentsList(fetchedComments);
        setCommentsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [selectedSuggestion, commentModalVisible]);

  const filteredSuggestions = useMemo(() => {
    const data = [...suggestions];
    if (filter === 'Popular') return data.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    return data.sort((a, b) => ((b as any).createdAt?.seconds ?? 0) - ((a as any).createdAt?.seconds ?? 0));
  }, [suggestions, filter]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved': return { backgroundColor: isDarkMode ? '#064E3B' : '#DCFCE7', color: isDarkMode ? '#34D399' : '#166534' };
      case 'Under Review': return { backgroundColor: isDarkMode ? '#451A03' : '#FEF9C3', color: isDarkMode ? '#FBBF24' : '#854D0E' };
      default: return { backgroundColor: isDarkMode ? '#1E3A8A' : '#DBEAFE', color: isDarkMode ? '#60A5FA' : '#1D4ED8' };
    }
  };

  const formatTimeAgo = (createdAt: any) => {
    if (!createdAt) return 'Just now';
    const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt.seconds * 1000);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleLike = async (item: SuggestionItem) => {
    if (!item.id || likingId) return;
    const isLiked = userLikes.includes(item.id);
    try {
      setLikingId(item.id);
      await updateDoc(doc(db, 'suggestions', item.id), { 
        likes: increment(isLiked ? -1 : 1) 
      });
      setUserLikes(prev => isLiked ? prev.filter(id => id !== item.id) : [...prev, item.id!]);
      setSuggestions(prev => prev.map(s => s.id === item.id ? { ...s, likes: (s.likes ?? 0) + (isLiked ? -1 : 1) } : s));
    } catch (error) { Alert.alert('Error', 'Action failed.'); }
    finally { setLikingId(null); }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!selectedSuggestion?.id) return;
    const isLiked = commentLikes.includes(commentId);
    try {
      const commentRef = doc(db, 'suggestions', selectedSuggestion.id, 'comments', commentId);
      await updateDoc(commentRef, { likes: increment(isLiked ? -1 : 1) });
      setCommentLikes(prev => isLiked ? prev.filter(id => id !== commentId) : [...prev, commentId]);
    } catch (error) { console.log('COMMENT HEART ERROR:', error); }
  };

  const handleSubmitComment = async () => {
    if (!selectedSuggestion?.id || !commentText.trim()) return;
    try {
      setCommentingId(selectedSuggestion.id);
      const text = commentText.trim();
      setCommentText('');
      await addDoc(collection(db, 'suggestions', selectedSuggestion.id, 'comments'), {
        text,
        createdAt: serverTimestamp(),
        userName: 'Member',
        likes: 0,
        parentId: replyingTo ? replyingTo.id : null,
      });
      if (!replyingTo) {
        await updateDoc(doc(db, 'suggestions', selectedSuggestion.id), { comments: increment(1) });
        setSuggestions(prev => prev.map(s => s.id === selectedSuggestion.id ? { ...s, comments: (s.comments ?? 0) + 1 } : s));
      }
      setReplyingTo(null);
    } catch (error) { Alert.alert('Error', 'Failed to post.'); }
    finally { setCommentingId(null); }
  };

  return (
    <ThemedView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <ThemedText style={[styles.headerTitle, isDarkMode && styles.darkText]}>Community Insights</ThemedText>
            <ThemedText style={[styles.headerSubtitle, isDarkMode && styles.darkSubText]}>Voice your ideas for a better future.</ThemedText>
          </View>
          <TouchableOpacity style={styles.newButton} onPress={() => router.push('/new-suggestion')}>
            <Ionicons name="add" size={20} color="white" />
            <ThemedText style={styles.newButtonText}>Share</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.filterContainer, isDarkMode && styles.darkCard]}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'Popular' && (isDarkMode ? styles.darkActiveFilterTab : styles.activeFilterTab)]} 
            onPress={() => setFilter('Popular')}
          >
            <ThemedText style={[styles.filterText, filter === 'Popular' && (isDarkMode ? styles.darkActiveFilterText : styles.activeFilterText)]}>Trending</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'Newest' && (isDarkMode ? styles.darkActiveFilterTab : styles.activeFilterTab)]} 
            onPress={() => setFilter('Newest')}
          >
            <ThemedText style={[styles.filterText, filter === 'Newest' && (isDarkMode ? styles.darkActiveFilterText : styles.activeFilterText)]}>Latest</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSuggestions(true)} tintColor="#6366F1" />}>
          {loading ? <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} /> : 
            filteredSuggestions.map((item) => (
              <IdeaCard 
                key={item.id} 
                author={(item as any).userName || 'Member'} 
                time={formatTimeAgo((item as any).createdAt)} 
                title={item.title || 'Idea'} 
                desc={(item as any).description} 
                likes={item.likes ?? 0} 
                comments={item.comments ?? 0} 
                status={(item as any).status || 'New'} 
                category={(item as any).category || 'General'} 
                statusStyle={getStatusStyle((item as any).status || 'New')} 
                onLike={() => handleLike(item)} 
                isLiked={userLikes.includes(item.id!)}
                onComment={() => { setSelectedSuggestion(item); setCommentModalVisible(true); }} 
                likeLoading={likingId === item.id} 
              />
            ))
          }
        </ScrollView>

        <Modal visible={commentModalVisible} transparent animationType="slide" onRequestClose={() => setCommentModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={[styles.modalCard, isDarkMode && styles.darkModalCard]}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalHeaderIndicator, isDarkMode && { backgroundColor: '#334155' }]} />
                <TouchableOpacity onPress={() => {setCommentModalVisible(false); setReplyingTo(null);}} style={styles.closeModalBtn}>
                   <Ionicons name="close-circle" size={28} color={isDarkMode ? '#475569' : '#CBD5E1'} />
                </TouchableOpacity>
              </View>

              <View style={styles.commentHeaderRow}>
                <ThemedText style={[styles.modalTitle, isDarkMode && styles.darkText]}>Comments</ThemedText>
                <View style={styles.commentCountBadge}>
                   <ThemedText style={styles.commentCountText}>{commentsList.length}</ThemedText>
                </View>
              </View>
              
              <ScrollView style={styles.commentsScrollView} showsVerticalScrollIndicator={false}>
                {commentsLoading ? (
                  <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
                ) : (
                  commentsList.filter(c => !c.parentId).map((c) => (
                    <View key={c.id} style={styles.commentThreadContainer}>
                      <View style={[styles.commentBubble, isDarkMode ? styles.darkCommentBubble : { backgroundColor: '#F8FAFC' }]}>
                        <View style={styles.commentInfo}>
                          <ThemedText style={[styles.commentUser, isDarkMode && styles.darkText]}>{c.userName}</ThemedText>
                          <ThemedText style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</ThemedText>
                        </View>
                        <ThemedText style={[styles.commentBody, isDarkMode && styles.darkSubText]}>{c.text}</ThemedText>
                        
                        <View style={[styles.commentActions, isDarkMode && { borderTopColor: '#334155' }]}>
                          <TouchableOpacity style={styles.commentActionBtn} onPress={() => handleLikeComment(c.id)}>
                            <Ionicons 
                              name={commentLikes.includes(c.id) ? "heart" : "heart-outline"} 
                              size={16} 
                              color={commentLikes.includes(c.id) ? "#EF4444" : "#94A3B8"} 
                            />
                            <ThemedText style={[styles.commentActionText, commentLikes.includes(c.id) && {color: '#EF4444'}]}>{c.likes || 0}</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.commentActionBtn} onPress={() => setReplyingTo({ id: c.id, name: c.userName })}>
                            <Ionicons name="arrow-undo-outline" size={16} color="#94A3B8" />
                            <ThemedText style={styles.commentActionText}>Reply</ThemedText>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {commentsList.filter(r => r.parentId === c.id).map(reply => (
                        <View key={reply.id} style={styles.replyRow}>
                          <View style={[styles.replyConnector, isDarkMode && { backgroundColor: '#334155' }]} />
                          <View style={[styles.commentBubble, styles.replyBubble, isDarkMode ? { backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1 } : { backgroundColor: '#F1F5F9' }]}>
                            <View style={styles.commentInfo}>
                              <ThemedText style={[styles.commentUser, isDarkMode && styles.darkText, { fontSize: 12 }]}>{reply.userName}</ThemedText>
                              <TouchableOpacity onPress={() => handleLikeComment(reply.id)} style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                                 <ThemedText style={{fontSize: 10, color: '#94A3B8'}}>{reply.likes || 0}</ThemedText>
                                 <Ionicons name={commentLikes.includes(reply.id) ? "heart" : "heart-outline"} size={14} color={commentLikes.includes(reply.id) ? "#EF4444" : "#94A3B8"} />
                              </TouchableOpacity>
                            </View>
                            <ThemedText style={[styles.commentBody, isDarkMode && styles.darkSubText, { fontSize: 13 }]}>{reply.text}</ThemedText>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={[styles.inputSection, isDarkMode && { borderTopColor: '#334155' }]}>
                {replyingTo && (
                  <View style={[styles.replyIndicator, isDarkMode && { backgroundColor: '#312E81' }]}>
                    <ThemedText style={[styles.replyIndicatorText, isDarkMode && { color: '#C7D2FE' }]}>Replying to <ThemedText style={{fontWeight: '900'}}>@{replyingTo.name}</ThemedText></ThemedText>
                    <TouchableOpacity onPress={() => setReplyingTo(null)}>
                      <Ionicons name="close-circle" size={20} color={isDarkMode ? "#C7D2FE" : "#6366F1"} />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.commentInputWrapper}>
                  <TextInput
                    style={[styles.miniInput, isDarkMode && styles.darkInput, isDarkMode && styles.darkText]}
                    placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                    placeholderTextColor="#94A3B8"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <TouchableOpacity 
                    style={[styles.sendBtn, !commentText.trim() && { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]} 
                    onPress={handleSubmitComment} 
                    disabled={!commentText.trim() || !!commentingId}
                  >
                    {commentingId ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={18} color="white" />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <View style={[styles.tabBar, isDarkMode && styles.darkCard]}>
          <TabIcon icon="home-outline" label="Home" onPress={() => router.push('/(home_dasborad)/home.dashboard')} />
          <TabIcon icon="document-text-outline" label="Reports" onPress={() => router.push('/(reports_dashboard)/reports.dashboard')} />
          <TabIcon icon="map-outline" label="Maps" onPress={() => router.push('/(maps.dashboard)/maps.dashboard')} />
          <TabIcon icon="bulb-outline" label="Ideas" active />
          <TabIcon icon="person-outline" label="Profile" onPress={() => router.push('/profile')} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function IdeaCard({ author, time, title, desc, likes, comments, status, category, statusStyle, onLike, isLiked, onComment, likeLoading }: any) {
    const { isDarkMode } = useTheme();
    return (
      <View style={[styles.card, isDarkMode && styles.darkCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? '#374151' : '#EEF2FF' }]}>
              <ThemedText style={styles.avatarText}>{author.charAt(0).toUpperCase()}</ThemedText>
            </View>
            <View>
              <ThemedText style={[styles.userName, isDarkMode && styles.darkText]}>{author}</ThemedText>
              <ThemedText style={[styles.timeText, isDarkMode && styles.darkSubText]}>{time}</ThemedText>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <ThemedText style={[styles.statusText, { color: statusStyle.color }]}>{status}</ThemedText>
          </View>
        </View>
  
        <View style={styles.cardBody}>
          <View style={[styles.categoryBadge, isDarkMode && { backgroundColor: '#312E81' }]}>
            <ThemedText style={[styles.categoryBadgeText, isDarkMode && { color: '#C7D2FE' }]}>{category}</ThemedText>
          </View>
          <ThemedText style={[styles.ideaTitle, isDarkMode && styles.darkText]}>{title}</ThemedText>
          <ThemedText style={[styles.ideaDesc, isDarkMode && styles.darkSubText]} numberOfLines={3}>{desc}</ThemedText>
        </View>
  
        <View style={[styles.cardFooter, { borderTopColor: isDarkMode ? '#374151' : '#F1F5F9' }]}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={[styles.interactionButton, isDarkMode && styles.darkInteraction]} onPress={onLike}>
              {likeLoading ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={22} 
                  color={isLiked ? "#EF4444" : "#6366F1"} 
                />
              )}
              <ThemedText style={[styles.statNumber, isLiked && { color: '#EF4444' }]}>{likes}</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.interactionButton, isDarkMode && styles.darkInteraction]} onPress={onComment}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              <ThemedText style={[styles.statNumber, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{comments}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  
  function TabIcon({ icon, label, active, onPress }: any) {
    return (
        <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
          <Ionicons name={active ? icon.replace('-outline', '') : icon} size={22} color={active ? '#2F70E9' : '#9CA3AF'} />
          <ThemedText style={[styles.tabLabel, { color: active ? '#2F70E9' : '#9CA3AF' }]}>{label}</ThemedText>
        </TouchableOpacity>
    );
  }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  darkContainer: { backgroundColor: '#0F172A' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  darkText: { color: '#F8FAFC' },
  darkSubText: { color: '#94A3B8' },
  newButton: { backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 6 },
  newButtonText: { color: 'white', fontWeight: '800' },
  filterContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', marginHorizontal: 20, borderRadius: 14, padding: 4, marginBottom: 18 },
  darkCard: { backgroundColor: '#1E293B', borderBottomWidth: 0 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  activeFilterTab: { backgroundColor: 'white', elevation: 2 },
  darkActiveFilterTab: { backgroundColor: '#334155' },
  filterText: { color: '#64748B', fontWeight: '700' },
  activeFilterText: { color: '#0F172A' },
  darkActiveFilterText: { color: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 110 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#6366F1', fontWeight: '800', fontSize: 16 },
  userName: { fontSize: 15, fontWeight: '800' },
  timeText: { fontSize: 12, color: '#94A3B8' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, height: 26 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  cardBody: { marginBottom: 16 },
  categoryBadge: { backgroundColor: '#EEF2FF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  categoryBadgeText: { color: '#6366F1', fontSize: 11, fontWeight: '700' },
  ideaTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6, lineHeight: 22 },
  ideaDesc: { fontSize: 14, color: '#475569', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1 },
  statsRow: { flexDirection: 'row', gap: 12 },
  interactionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, gap: 6 },
  darkInteraction: { backgroundColor: '#334155' },
  statNumber: { fontSize: 14, fontWeight: '800', color: '#6366F1' },
  tabBar: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 24, paddingHorizontal: 10, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tabItem: { alignItems: 'center', flex: 1 },
  tabLabel: { marginTop: 4, fontSize: 10, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 20, height: '88%' },
  darkModalCard: { backgroundColor: '#1E293B' },
  modalHeader: { alignItems: 'center', marginBottom: 16 },
  modalHeaderIndicator: { width: 45, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10 },
  closeModalBtn: { position: 'absolute', right: 0, top: -10 },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  commentCountBadge: { backgroundColor: '#6366F1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  commentCountText: { color: 'white', fontSize: 12, fontWeight: '800' },
  commentsScrollView: { flex: 1 },
  commentThreadContainer: { marginBottom: 20 },
  commentBubble: { padding: 14, borderRadius: 20, borderTopLeftRadius: 4 },
  darkCommentBubble: { backgroundColor: '#334155' },
  commentInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commentUser: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  commentTime: { fontSize: 11, color: '#94A3B8' },
  commentBody: { fontSize: 15, color: '#475569', lineHeight: 21 },
  commentActions: { flexDirection: 'row', gap: 20, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  commentActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentActionText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  replyRow: { flexDirection: 'row', marginTop: 10 },
  replyConnector: { width: 2, backgroundColor: '#E2E8F0', marginLeft: 15, marginRight: 15, borderRadius: 1 },
  replyBubble: { flex: 1, borderRadius: 18, borderTopLeftRadius: 4, padding: 12 },
  noCommentsWrap: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
  noCommentsText: { marginTop: 12, color: '#64748B', fontWeight: '700', fontSize: 16 },
  inputSection: { paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  replyIndicator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 10, borderRadius: 12, marginBottom: 10 },
  replyIndicatorText: { color: '#6366F1', fontSize: 13 },
  commentInputWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 10 },
  miniInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, maxHeight: 120 },
  darkInput: { backgroundColor: '#0F172A', borderColor: '#334155', borderWidth: 1 },
  sendBtn: { backgroundColor: '#6366F1', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});