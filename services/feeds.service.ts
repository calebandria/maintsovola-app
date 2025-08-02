import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Configuration du client Supabase avec les mêmes paramètres que AuthContext
const getSupabaseClient = () => {
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Variables d'environnement Supabase manquantes");
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

const supabase = getSupabaseClient();

type Utilisateur = {
  id_utilisateur: number;
  nom: string;
  prenoms: string;
  photo_profil: string;
};

type CommentData = {
  id_commentaire: number;
  texte: string;
  date_creation: string;
  id_utilisateur: number;
  id_parent_commentaire: number | null;
  utilisateur: Utilisateur;
};

type LikeData = {
  id_commentaire: number;
  id_utilisateur: number;
};

type GetAllProjectsParams = {
  limit?: number;
  page?: number;
};

export const getAllProjects = async (params?: GetAllProjectsParams) => {
  const limit = params?.limit;
  const page = params?.page;
  const offset = limit && page ? (page - 1) * limit : undefined;

  let query = supabase
    .from('vue_projet_detaille')
    .select(
      `
      id_projet,
      titre,
      description,
      surface_ha,
      statut,
      created_at,
      id_tantsaha,
      id_commune,
      id_technicien,
      nom_tantsaha,
      prenoms_tantsaha,
      photo_profil,
      nom_commune,
      nom_district,
      nom_region,
      cultures,
      cout_total,
      revenu_total,
      rendement_total,
      rendements_detail,
      montant_investi,
      gap_a_financer,
      est_finance_completement,
      nombre_likes,
      nombre_commentaires
    `
    )
    .order('created_at', { ascending: false });

  if (limit !== undefined && offset !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching project data:', error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  const projectIds = data.map((project) => project.id_projet);
  const { data: photosData, error: photosError } = await supabase
    .from('projet')
    .select(
      'id_projet, photos, created_at, id_terrain, terrain:id_terrain(id_terrain, nom_terrain)'
    )
    .in('id_projet', projectIds);

  if (photosError) {
    console.error('Error fetching project photos:', photosError);
    // Tu peux choisir ici si tu veux throw ou retourner sans photos
    return data; // fallback sans photos
  }

  const projectsWithPhotos = data.map((project) => {
    const projectPhotos = photosData?.find((p) => p.id_projet === project.id_projet);
    return {
      ...project,
      photos: projectPhotos?.photos || null,
      created_at: projectPhotos?.created_at || project.created_at,
      id_terrain: projectPhotos?.id_terrain || null,
      terrain: projectPhotos?.terrain || null,
    };
  });

  return projectsWithPhotos;
};

export const getProjectById = async (projectId: string) => {
  const { data, error } = await supabase
    .from('vue_projet_detaille')
    .select(
      `
      id_projet,
      titre,
      description,
      surface_ha,
      statut,
      created_at,
      id_tantsaha,
      id_commune,
      id_technicien,
      nom_tantsaha,
      prenoms_tantsaha,
      photo_profil,
      nom_commune,
      nom_district,
      nom_region,
      cultures,
      cout_total,
      revenu_total,
      rendement_total,
      rendements_detail,
      montant_investi,
      gap_a_financer,
      est_finance_completement,
      nombre_likes,
      nombre_commentaires
    `
    )
    .eq('id_projet', projectId)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  // Récupérer les photos du projet
  const { data: photoData, error: photoError } = await supabase
    .from('projet')
    .select('photos, created_at, id_terrain, terrain:id_terrain(id_terrain, nom_terrain)')
    .eq('id_projet', projectId)
    .single();

  if (photoError) {
    console.error('Error fetching project photo:', photoError);
  }

  // Combiner les données du projet avec ses photos
  const projectWithPhotos = {
    ...data,
    photos: photoData?.photos || null,
    created_at: photoData?.created_at || data.created_at,
    id_terrain: photoData?.id_terrain || null,
    terrain: photoData?.terrain || null,
  };

  return projectWithPhotos;
};

export const getProjetctFromFollowing = async (
  userId: string,
  options?: { limit?: number; page?: number }
) => {
  try {
    const { limit, page } = options || {};
    const offset = limit && page ? (page - 1) * limit : undefined;

    // 1. Récupérer les utilisateurs suivis
    const { data: followingUsers, error: followingError } = await supabase
      .from('abonnement')
      .select('id_suivi')
      .eq('id_abonne', userId);

    if (followingError) throw followingError;
    if (!followingUsers || followingUsers.length === 0) return [];

    const followedUserIds = followingUsers.map((follow) => follow.id_suivi);

    // 2. Construire la requête pour récupérer les projets
    let query = supabase
      .from('vue_projet_detaille')
      .select(
        `
        id_projet,
        titre,
        description,
        surface_ha,
        statut,
        created_at,
        id_tantsaha,
        id_commune,
        id_technicien,
        nom_tantsaha,
        prenoms_tantsaha,
        photo_profil,
        nom_commune,
        nom_district,
        nom_region,
        cultures,
        cout_total,
        revenu_total,
        rendement_total,
        rendements_detail,
        montant_investi,
        gap_a_financer,
        est_finance_completement,
        nombre_likes,
        nombre_commentaires
      `
      )
      .in('id_tantsaha', followedUserIds)
      .order('created_at', { ascending: false });

    if (limit !== undefined && offset !== undefined) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) return [];

    // 3. Récupérer les photos liées aux projets
    const projectIds = data.map((project) => project.id_projet);
    const { data: photosData, error: photosError } = await supabase
      .from('projet')
      .select(
        'id_projet, photos, created_at, id_terrain, terrain:id_terrain(id_terrain, nom_terrain)'
      )
      .in('id_projet', projectIds);

    if (photosError) {
      console.error('Error fetching project photos:', photosError);
    }

    // 4. Fusionner projets + photos
    const projectsWithPhotos = data.map((project) => {
      const projectPhotos = photosData?.find((p) => p.id_projet === project.id_projet);
      return {
        ...project,
        photos: projectPhotos?.photos ? projectPhotos.photos.split(',') : [],
        created_at: projectPhotos?.created_at || project.created_at,
        id_terrain: projectPhotos?.id_terrain || null,
        terrain: projectPhotos?.terrain || null,
      };
    });

    console.log(
      `Found ${projectsWithPhotos.length} projects from ${followedUserIds.length} followed users`
    );
    return projectsWithPhotos;
  } catch (error) {
    console.error('Error fetching projects from following:', error);
    throw error;
  }
};

export const getCommentsByProjectId = async (projectId: number, userId?: string) => {
  // Première requête : récupérer les commentaires sans les informations utilisateur
  const { data: commentsData, error: commentsError } = await supabase
    .from('commentaire')
    .select(
      `
          id_commentaire,
          texte,
          date_creation,
          id_utilisateur,
          id_parent_commentaire
        `
    )
    .eq('id_projet', projectId)
    .order('date_creation', { ascending: true });

  if (commentsError) {
    throw commentsError;
  }

  if (!commentsData || commentsData.length === 0) {
    return [];
  }

  // Récupérer les IDs d'utilisateurs uniques
  const userIds = [...new Set(commentsData.map((comment) => comment.id_utilisateur))];

  // Deuxième requête : récupérer les informations des utilisateurs
  const { data: usersData, error: usersError } = await supabase
    .from('utilisateur')
    .select('id_utilisateur, nom, prenoms, photo_profil')
    .in('id_utilisateur', userIds);

  if (usersError) {
    console.error('Error fetching users data:', usersError);
    // Continuer sans les données utilisateur si erreur
  }

  // Créer un map des utilisateurs pour accès rapide
  const usersMap =
    usersData?.reduce(
      (acc, user) => {
        acc[user.id_utilisateur] = user;
        return acc;
      },
      {} as Record<number, any>
    ) || {};

  // Si on a des commentaires et un userId, récupérer les likes en une seule requête
  const commentIds = commentsData.map((comment) => comment.id_commentaire);

  // Récupérer tous les likes pour ces commentaires en une seule requête
  const { data: likesData, error: likesError } = await supabase
    .from('aimer_commentaire')
    .select('id_commentaire, id_utilisateur')
    .in('id_commentaire', commentIds);

  if (likesError) {
    console.error('Error fetching comment likes:', likesError);
  }

  // Grouper les likes par commentaire
  const likesByComment =
    likesData?.reduce(
      (acc, like) => {
        if (!acc[like.id_commentaire]) {
          acc[like.id_commentaire] = [];
        }
        acc[like.id_commentaire].push(like);
        return acc;
      },
      {} as Record<number, any[]>
    ) || {};

  // Combiner toutes les données
  const commentsWithLikes = commentsData.map((comment) => {
    const commentLikes = likesByComment[comment.id_commentaire] || [];
    return {
      ...comment,
      utilisateur: usersMap[comment.id_utilisateur] || {
        nom: 'Utilisateur',
        prenoms: 'Inconnu',
        photo_profil: null,
      },
      likes: commentLikes.length,
      isLiked: userId ? commentLikes.some((like) => like.id_utilisateur === userId) : false,
    };
  });

  return commentsWithLikes;
};

export const getLikesByCommentId = async (commentId: number) => {
  const { data, error } = await supabase
    .from('aimer_commentaire')
    .select('id_commentaire, id_utilisateur')
    .eq('id_commentaire', commentId);

  if (error) {
    throw error;
  }

  return data;
};

export const getProjectLikesCount = async (projectId: string) => {
  const { data, error } = await supabase
    .from('aimer_projet')
    .select('id_projet', { count: 'exact' })
    .eq('id_projet', projectId);

  if (error) {
    throw error;
  }

  return data?.length || 0;
};

export const getProjectLikesWithUserStatus = async (projectId: number, userId?: string) => {
  const { data, error } = await supabase
    .from('aimer_projet')
    .select('id_projet, id_utilisateur')
    .eq('id_projet', projectId);

  if (error) {
    throw error;
  }

  const likesCount = data?.length || 0;
  const isLiked = userId ? data?.some((like) => like.id_utilisateur === userId) || false : false;

  return { likesCount, isLiked };
};

export const getFilteredProjects = async (filters: {
  userId?: string;
  status?: string;
  region?: string;
  district?: string;
  commune?: string;
  culture?: string;
  limit?: number;
  page?: number;
}) => {
  const { limit, page, ...otherFilters } = filters;
  const offset = limit && page ? (page - 1) * limit : undefined;

  let query = supabase
    .from('vue_projet_detaille')
    .select(
      `
      id_projet,
      titre,
      description,
      surface_ha,
      statut,
      created_at,
      id_tantsaha,
      id_commune,
      id_technicien,
      nom_tantsaha,
      prenoms_tantsaha,
      photo_profil,
      nom_commune,
      nom_district,
      nom_region,
      cultures,
      cout_total,
      revenu_total,
      rendement_total,
      rendements_detail,
      montant_investi,
      gap_a_financer,
      est_finance_completement,
      nombre_likes,
      nombre_commentaires
    `
    )
    .order('created_at', { ascending: false });

  if (otherFilters.region) {
    query = query.eq('nom_region', otherFilters.region);
  }
  if (otherFilters.district) {
    query = query.eq('nom_district', otherFilters.district);
  }
  if (otherFilters.commune) {
    query = query.eq('nom_commune', otherFilters.commune);
  }
  if (otherFilters.culture) {
    query = query.ilike('cultures', `%${otherFilters.culture}%`);
  }
  if (otherFilters.status) {
    query = query.eq('statut', otherFilters.status);
  }
  if (otherFilters.userId) {
    query = query.eq('id_tantsaha', otherFilters.userId);
  }

  // Appliquer la pagination
  if (limit !== undefined && offset !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Récupérer les photos pour chaque projet
  if (data && data.length > 0) {
    const projectIds = data.map((project) => project.id_projet);
    const { data: photosData, error: photosError } = await supabase
      .from('projet')
      .select(
        'id_projet, photos, created_at, id_terrain, terrain:id_terrain(id_terrain, nom_terrain)'
      )
      .in('id_projet', projectIds);

    if (photosError) {
      console.error('Error fetching project photos:', photosError);
    } else {
      // Combiner les données des projets avec leurs photos
      const projectsWithPhotos = data.map((project) => {
        const projectPhotos = photosData?.find((p) => p.id_projet === project.id_projet);

        console.log(projectPhotos?.photos);

        return {
          ...project,
          photos: projectPhotos?.photos ? projectPhotos.photos.split(',') : [],
          created_at: projectPhotos?.created_at || project.created_at,
          id_terrain: projectPhotos?.id_terrain || null,
          terrain: projectPhotos?.terrain || null,
        };
      });
      console.log(`Found ${projectsWithPhotos.length} projects with photos`);
      return projectsWithPhotos;
    }
  }

  return data;
};

export const postLikeProject = async (projectId: number, data: any) => {
  console.log(data);

  const { data: reactionData, error } = await supabase
    .from('aimer_projet')
    .insert([{ id_projet: projectId, ...data }]);

  if (error) {
    throw error;
  }

  return reactionData;
};

export const postComment = async (commentData: {
  projectId: number;
  userId: string;
  text: string;
  parentCommentId?: number | null;
}) => {
  const { data, error } = await supabase
    .from('commentaire')
    .insert([
      {
        id_projet: commentData.projectId,
        id_utilisateur: commentData.userId,
        texte: commentData.text,
        id_parent_commentaire: commentData.parentCommentId,
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  return data;
};

export const postLikeComment = async (commentId: number, userId: string) => {
  const { data, error } = await supabase
    .from('aimer_commentaire')
    .insert([{ id_commentaire: commentId, id_utilisateur: userId }])
    .select();

  if (error) {
    throw error;
  }

  return data;
};

export const removeLikeProject = async (projectId: number, userId: string) => {
  const { data, error } = await supabase
    .from('aimer_projet')
    .delete()
    .eq('id_projet', projectId)
    .eq('id_utilisateur', userId);

  if (error) {
    throw error;
  }

  return data;
};

export const removeLikeComment = async (commentId: number, userId: string) => {
  const { data, error } = await supabase
    .from('aimer_commentaire')
    .delete()
    .eq('id_commentaire', commentId)
    .eq('id_utilisateur', userId);

  if (error) {
    throw error;
  }

  return data;
};

export const getProjectCultureDetails = async (projectId: string) => {
  const { data, error } = await supabase
    .from('projet_culture')
    .select(
      `
      id_projet_culture,
      id_projet,
      id_culture,
      cout_exploitation_previsionnel,
      rendement_previsionnel,
      cout_exploitation_reel,
      rendement_reel,
      date_debut_previsionnelle,
      date_debut_reelle,
      created_at,
      modified_at,
      created_by,
      rendement_financier_previsionnel,
      culture:id_culture(
        nom_culture,
        prix_tonne
      )
    `
    )
    .eq('id_projet', parseInt(projectId));

  console.log(data);

  if (error) {
    throw error;
  }

  return data || [];
};
