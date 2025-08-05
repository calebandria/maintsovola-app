import { useState, useEffect } from 'react';
import { supabase } from '~/lib/data'; // adapte ce chemin à ton projet

export const useFetchUserRoleByID = (userId: string | null | undefined) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('utilisateurs_par_role')
          .select('nom_role')
          .eq('id_utilisateur', userId)
          .single();

        if (error) throw error;

        setUserRole(data?.nom_role ?? null);
      } catch (err) {
        console.error("Erreur lors de la récupération du rôle de l'utilisateur:", err);
        setError(err);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [userId]);

  return { userRole, loading, error };
};
