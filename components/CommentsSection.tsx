import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProjectInteractions } from '~/hooks/use-project-interactions';

interface CommentsSectionProps {
  projectId: number;
  userId?: string;
  isVisible: boolean;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ projectId, userId, isVisible }) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const { comments, loading, commentsLoading, addComment, toggleCommentLike } =
    useProjectInteractions({ projectId, userId });

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment(newComment, replyingTo || undefined);
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderComment = (comment: any, isReply = false) => (
    <View
      key={comment.id_commentaire}
      className={`mb-3 ${isReply ? 'ml-6 border-l-2 border-gray-200 pl-3' : ''}`}>
      <View className="flex-row">
        {/* Avatar */}
        <View className="mr-3">
          {comment.utilisateur.photo_profil ? (
            <Image
              source={{ uri: comment.utilisateur.photo_profil }}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <View className="h-8 w-8 items-center justify-center rounded-full bg-gray-300">
              <Text className="text-sm font-semibold text-gray-600">
                {comment.utilisateur.prenoms?.charAt(0) || 'U'}
              </Text>
            </View>
          )}
        </View>

        {/* Comment Content */}
        <View className="flex-1">
          <View className="rounded-lg bg-gray-100 p-3">
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">
                {`${comment.utilisateur.prenoms || ''} ${comment.utilisateur.nom || ''}`.trim() ||
                  'Utilisateur'}
              </Text>
              <Text className="text-xs text-gray-500">{formatDate(comment.date_creation)}</Text>
            </View>
            <Text className="text-sm text-gray-700">{comment.texte}</Text>
          </View>

          {/* Comment Actions */}
          <View className="mt-2 flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => toggleCommentLike(comment.id_commentaire)}
              className="flex-row items-center gap-1">
              <Ionicons
                name={comment.isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.isLiked ? '#ef4444' : '#6b7280'}
              />
              {comment.likes > 0 && <Text className="text-xs text-gray-500">{comment.likes}</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setReplyingTo(comment.id_commentaire)}
              className="flex-row items-center gap-1">
              <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
              <Text className="text-xs text-gray-500">Répondre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Replies - only show if this is not already a reply to avoid deep nesting */}
      {!isReply &&
        comments
          .filter((reply) => reply.id_parent_commentaire === comment.id_commentaire)
          .map((reply) => renderComment(reply, true))}
    </View>
  );

  if (!isVisible) return null;

  return (
    <View className="mt-4 border-t border-gray-200 pt-4">
      <Text className="mb-3 text-base font-semibold text-gray-900">
        Commentaires ({comments.filter((c) => !c.id_parent_commentaire).length})
      </Text>

      {/* Comments List */}
      {commentsLoading ? (
        <View className="items-center py-4">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="mt-2 text-sm text-gray-500">Chargement des commentaires...</Text>
        </View>
      ) : (
        <ScrollView
          className="mb-4"
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}>
          {comments
            .filter((comment) => !comment.id_parent_commentaire) // Only root comments
            .map((comment) => renderComment(comment))}

          {comments.filter((c) => !c.id_parent_commentaire).length === 0 && (
            <Text className="py-4 text-center text-sm text-gray-500">
              Aucun commentaire pour le moment. Soyez le premier à commenter !
            </Text>
          )}
        </ScrollView>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <View className="mb-2 flex-row items-center justify-between rounded-md bg-blue-50 p-2">
          <Text className="text-sm text-blue-600">Répondre à un commentaire...</Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Ionicons name="close" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      )}

      {/* Comment Input */}
      {userId && (
        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder={replyingTo ? 'Écrire une réponse...' : 'Ajouter un commentaire...'}
              multiline
              className="max-h-[46px] rounded-lg border border-gray-300 p-3 text-sm focus:border-green-600"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || loading}
            className={`rounded-lg p-3 ${
              newComment.trim() && !loading ? 'bg-green-600' : 'bg-gray-300'
            }`}>
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={20} color={newComment.trim() ? '#ffffff' : '#6b7280'} />
            )}
          </TouchableOpacity>
        </View>
      )}

      {!userId && (
        <Text className="mt-2 text-center text-sm text-gray-500">
          Connectez-vous pour commenter
        </Text>
      )}
    </View>
  );
};

export default CommentsSection;
