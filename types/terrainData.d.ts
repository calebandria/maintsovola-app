export interface TerrainData {
    id_terrain: number;
    surface_proposee: number;
    surface_validee: number;
    acces_eau: boolean;
    acces_route: boolean;
    statut: boolean;
    created_at?: string;
    id_tantsaha: string;
    id_superviseur?: string;
    id_technicien?: string;
    modif_at?: string;
    created_by?: string;
    geom?: string;
    archive: boolean;
    nom_terrain?: string;
    photos?: string;
    date_validation?: string;
    photo_validation: string;
    rapport_validation?: string;
    validation_decision?: string;
    id_region?: number;
    id_district: number;
    id_commune: number;

    region?: {nom: string;}
    district?: {nom: string;}
    commune?: {nom: string;}
}