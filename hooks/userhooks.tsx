import { useEffect, useState } from 'react';
import { supabase } from "~/lib/data";

export interface UserProfile {
  photo_profil?: string;
  nom: string;
  prenoms?: string;
  nom_role?: string;
  bio?: string;
  adresse?: string;
  telephone?: string;
  email: string;
}

export const useProfile = (userId: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('utilisateur') // Nom de ta table
        .select('*')
        .eq('id_utilisateur', userId)
        .single();

      if (error) {
        console.error('Erreur de récupération :', error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading };
};

export const useProjectsCount = (userId: string) => {
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectsCount = async () => {
      const { count, error } = await supabase
        .from('projet')
        .select('id_projet', { count: 'exact', head: true })
        .eq('id_tantsaha', userId);

      if (error) {
        console.error('Erreur de récupération du nombre de projets:', error.message);
        setProjectsCount(0);
      } else {
        setProjectsCount(count || 0);
        // console.log('Nombre de projets:', count);
      }
      setLoading(false);
    };

    fetchProjectsCount();
  }, [userId]);

  return { projectsCount, loading };
};

export const useFollowersCount = (userId: string) => {
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowersCount = async () => {
      const { count, error } = await supabase
        .from('abonnement')
        .select('id_abonnement', { count: 'exact' })
        .eq('id_suivi', userId);

      if (error) {
        console.error('Erreur de récupération du nombre de followers:', error.message);
        setFollowersCount(0);
      } else {
        setFollowersCount(count || 0);
        // console.log('Nombre de followers:', count);
      }
      setLoading(false);
    };

    fetchFollowersCount();
  }, [userId]);

  return { followersCount, loading };
}

export const useFollowingCount = (userId: string) => {
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowingCount = async () => {
      const { count, error } = await supabase
        .from('abonnement')
        .select('id_abonnement', { count: 'exact' })
        .eq('id_abonne', userId);

      if (error) {
        console.error('Erreur de récupération du nombre de following:', error.message);
        setFollowingCount(0);
      } else {
        setFollowingCount(count || 0);
        // console.log('Nombre de following:', count);
      }
      setLoading(false);
    };

    fetchFollowingCount();
  }, [userId]);

  return { followingCount, loading };
};



