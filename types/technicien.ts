// Add these interfaces
export interface JalonAgricole {
  nom_jalon: string;
  id_culture: number;
}

export interface Culture {
  id_culture: number;
  nom_culture: string;
}

export interface ProjetCulture {
  id_projet_culture: number;
  culture: Culture;
  date_debut_previsionnelle: string;
  date_debut_reelle: string;
}

export interface Terrain {
  id_terrain: number;
  nom_terrain: string;
}
export interface AssignedParcel {
  id_projet: number;
  titre: string;
  surface_ha: number;
  statut: string;
  date_debut_production?: string;
  id_terrain?: number | '';
  nom_terrain?: string;
  cultures: Array<{
    nom_culture: string;
    phase_actuelle: 'ensemencement' | 'croissance' | 'recolte' | 'termine';
    date_semis?: string;
    date_recolte_prevue?: string;
    dernier_jalon?: string;
    date_dernier_jalon?: string;
    statut_jalon: string;
  }>;
  localisation: {
    region: string;
    district: string;
    commune: string;
  };
  prochaines_actions: string[];
}
export interface WeeklyTask {
  id_tache: number;
  id_projet: number;
  titre_projet: string;
  description: string;
  date_prevue: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  statut: 'a_faire' | 'en_cours' | 'fait' | 'retard' | 'bloque';
  type_intervention: string;
  duree_estimee?: number;
}

export interface InterventionReport {
  id_rapport: number;
  id_projet: number;
  id_technicien: string;
  date_intervention: string;
  type_intervention: string;
  description: string;
  observations: string;
  anomalies?: string;
  photos?: string[];
  signature_electronique?: string;
  statut: 'brouillon' | 'soumis' | 'valide';
}

export interface TechnicalResource {
  id_ressource: number;
  titre: string;
  type: 'fiche_technique' | 'guide_pratique' | 'procedure' | 'formation';
  culture?: string;
  contenu: string;
  fichier_url?: string;
  date_creation: string;
  tags: string[];
}

export interface PaymentMilestone {
  id_jalon: number;
  id_projet: number;
  nom_jalon: string;
  montant: number;
  date_prevue: string;
  date_reelle?: string;
  statut: 'en_attente' | 'valide' | 'paye';
  description: string;
}

// Ajoute ceci si ce n'est pas déjà présent :
export interface Projet {
  id_projet: number;
  titre: string;
  surface_ha: number;
  statut: string;
  date_debut_production?: string;
  id_region?: number | string;
  id_district?: number | string;
  id_commune?: number | string;
  id_terrain?: number;
  terrain?: Terrain;
  projet_culture: ProjetCulture[];
}

export interface JalonProjet {
  id_projet: number;
  date_previsionnelle: string;
  date_reelle?: string;
  jalon_agricole: JalonAgricole | null;
}
