import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { Card } from "react-native-paper";
import { ProgressBar } from "react-native-paper";
import { Badge } from "~/components/ui/terrain/Badge";
import { Button } from "~/components/ui/Button";
import { supabase } from "~/lib/data";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "~/components/terrain/UserAvatar";
import { ExternalLink } from "lucide-react-native";
import { TerrainCardDialog } from "~/components/terrain/TerrainCardDialog";
import { Separator } from "~/components/ui/Separator";
// import JalonReportDialog from "./JalonReportDialog"; 

interface ProjectDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  userRole?: string;
}

const formatCurrency = (value: number) =>
  value?.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' }) ?? '0 MGA';

const formatDate = (dateString: string) => {
  if (!dateString) return "Non défini";
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  userRole
}) => {
  console.log('ProjectDetailsDialog opened with projectId:', projectId);
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [jalons, setJalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJalon, setSelectedJalon] = useState<any>(null);
  const [currentFunding, setCurrentFunding] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalRendement, setTotalRendement] = useState<number>(0);
  const [rendementProduits, setRendementProduits] = useState<string>('');
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [fundingProgress, setFundingProgress] = useState<number>(0);
  const [terrainDialogOpen, setTerrainDialogOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'finances' | 'jalons'>('finances');

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDetails();
      fetchInvestments();
      fetchJalons();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (project && investments.length >= 0) {
      calculateFundingProgress();
    }
  }, [investments, project]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projet')
        .select(`
          *,
          tantsaha:id_tantsaha(nom, prenoms,photo_profil),
          technicien:id_technicien(nom, prenoms,photo_profil),
          superviseur:id_superviseur(nom, prenoms,photo_profil),
          terrain:id_terrain(*),
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          projet_culture:projet_culture(
            id_projet_culture,
            id_culture,
            cout_exploitation_previsionnel,
            rendement_previsionnel,
            date_debut_previsionnelle,
            culture:id_culture(nom_culture,prix_tonne,rendement_ha)
          )
        `)
        .eq('id_projet', projectId)
        .single();
      if (error) throw error;
      setProject(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les détails du projet",
        // variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investissement')
        .select(`
          *,
          investisseur:id_investisseur(nom, prenoms),
          statut_paiement:statut_paiement
        `)
        .eq('id_projet', projectId)
        .order('date_paiement', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {}
  };

  const fetchJalons = async () => {
    try {
      const { data, error } = await supabase
        .from('jalon_projet')
        .select(`
          *,
          jalon_agricole:id_jalon_agricole(nom_jalon, action_a_faire, id_culture),
          culture:jalon_agricole(id_culture(nom_culture))
        `)
        .eq('id_projet', projectId)
        .order('date_previsionnelle', { ascending: true });

      if (error) throw error;
      setJalons(data || []);
    } catch (error) {}
  };

  const calculateFundingProgress = () => {
    if (!project) return 0;
    const projetCultures = project.projet_culture || [];

    const totalFarmingCost = projetCultures.reduce((sum, pc) =>
      sum + ((pc.cout_exploitation_previsionnel || 0)), 0);

    const totalEstimatedRevenue = projetCultures.reduce((sum, pc) => {
      const rendement = pc.rendement_previsionnel || 0;
      const prixTonne = pc.culture?.prix_tonne || 0;
      return sum + (rendement * prixTonne);
    }, 0);

    const yieldStrings = projetCultures.map(pc => {
      const nom = pc.culture?.nom_culture || "Non spécifié";
      const tonnage = pc.rendement_previsionnel != null ? pc.rendement_previsionnel : (pc.culture?.rendement_ha || 0) * (project.surface_ha || 1);
      return `${Math.round(tonnage * 100) / 100} t de ${nom}`;
    });
    const expectedYieldLabel = yieldStrings.length > 0 ? yieldStrings.join(", ") : "N/A";
    const totalProfit = totalEstimatedRevenue - totalFarmingCost;

    const totalInvestment = investments.reduce((sum, inv) => sum + (inv.montant || 0), 0);
    setTotalCost(totalFarmingCost);
    setTotalRendement(totalEstimatedRevenue);
    setRendementProduits(expectedYieldLabel);
    setTotalProfit(totalProfit);
    setCurrentFunding(totalInvestment);
    const progress = totalFarmingCost === 0 ? 0 : Math.min(Math.round((totalInvestment / totalFarmingCost) * 100), 100);
    setFundingProgress(progress);
    return progress;
  };

  const handleStartProduction = async () => {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('projet')
        .update({
          statut: 'en cours',
          date_lancement: startDate
        })
        .eq('id_projet', projectId);

      if (error) throw error;
      toast({ title: "Succès", description: "Le projet a été lancé en production" });
      fetchProjectDetails();
      fetchJalons();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lancer le projet en production",
        // variant: "destructive"
      });
    }
  };

  const handleCompleteProject = async () => {
    try {
      const { error } = await supabase
        .from('projet')
        .update({
          statut: 'terminé',
          date_fin: new Date().toISOString().split('T')[0]
        })
        .eq('id_projet', projectId);

      if (error) throw error;
      toast({ title: "Succès", description: "Le projet a été marqué comme terminé" });
      fetchProjectDetails();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de terminer le projet",
        // variant: "destructive"
      });
    }
  };

  const allJalonsCompleted = () => {
    return jalons.length > 0 && jalons.every(j => j.date_reelle);
  };

  const getJalonStatus = (jalon: any): 'completed' | 'overdue' | 'normal' => {
    if (jalon.date_reelle) return 'completed';
    const today = new Date();
    const datePrevisionnelle = new Date(jalon.date_previsionnelle);
    if (datePrevisionnelle < today && !jalon.date_reelle) return 'overdue';
    return 'normal';
  };

  if (!isOpen) return null;

  if (loading || !project) {
    return (
      <Modal visible={isOpen} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/30">
          <View className="bg-white rounded-lg p-6 w-11/12 max-w-lg">
            <Text className="text-xl font-bold mb-4">Détails du projet</Text>
            <View className="items-center py-8">
              <ActivityIndicator size="large" />
              <Text>Chargement des détails du projet...</Text>
            </View>
            <Button onPress={onClose} className="mt-4">Fermer</Button>
          </View>
        </View>
      </Modal>
    );
  }

  const isFundingComplete = fundingProgress >= 100;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/30">
        <View className="bg-white rounded-lg p-4 w-11/12 max-h-[90%]">
          <ScrollView>
            <Text className="text-xl font-bold mb-4" numberOfLines={1} ellipsizeMode="tail">
              Détails du projet #{project.id_projet}
            </Text>
            <Card style={{ marginBottom: 16 }}>
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  <View style={{ flex: 1, minWidth: 160, marginBottom: 8 }}>
                    <Text className="text-gray-500 text-xs">Agriculteur</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <UserAvatar
                        photoUrl={project.tantsaha?.photo_profil}
                        name={typeof project.tantsaha?.nom === 'string' ? project.tantsaha.nom : 'Agriculteur'}
                        size="sm"
                      />
                      <Text className="ml-2 text-green-900" numberOfLines={1} ellipsizeMode="tail">
                        {project.tantsaha?.nom} {project.tantsaha?.prenoms || ''}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, minWidth: 160, marginBottom: 8 }}>
                    <Text className="text-gray-500 text-xs">Terrain</Text>
                    <TouchableOpacity onPress={() => setTerrainDialogOpen(true)}>
                      <Text className="text-green-900 underline" numberOfLines={1} ellipsizeMode="tail">
                        {project.terrain?.nom_terrain} ({project.surface_ha} ha)
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1, minWidth: 160, marginBottom: 8 }}>
                    <Text className="text-gray-500 text-xs">Localisation</Text>
                    <Text className="text-green-900" numberOfLines={1} ellipsizeMode="tail">
                      {project.region?.nom_region}, {project.district?.nom_district}, {project.commune?.nom_commune}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 160, marginBottom: 8 }}>
                    <Text className="text-gray-500 text-xs">Statut</Text>
                    <Badge>
                      {project.statut}
                    </Badge>
                  </View>
                  <View style={{ flex: 1, minWidth: 160, marginBottom: 8 }}>
                    <Text className="text-gray-500 text-xs">Cultures</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                      {project.projet_culture.map((pc: any) => (
                        <Badge key={pc.id_projet_culture} style={{ marginRight: 4, marginBottom: 4 }}>
                          {pc.culture?.nom_culture}
                        </Badge>
                      ))}
                    </View>
                  </View>
                </View>
                {project.description && (
                  <View style={{ marginTop: 8 }}>
                    <Text className="text-gray-500 text-xs mb-1">Description</Text>
                    <Text className="text-green-900">{project.description}</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Tabs */}
            <View className="flex-row mb-4">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-t-lg ${activeTab === 'finances' ? 'bg-green-100' : 'bg-gray-100'}`}
                onPress={() => setActiveTab('finances')}
              >
                <Text className={`text-center font-semibold ${activeTab === 'finances' ? 'text-green-700' : 'text-gray-700'}`}>Financement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-t-lg ${activeTab === 'jalons' ? 'bg-green-100' : 'bg-gray-100'}`}
                onPress={() => setActiveTab('jalons')}
              >
                <Text className={`text-center font-semibold ${activeTab === 'jalons' ? 'text-green-700' : 'text-gray-700'}`}>Jalons & Production</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'finances' && (
              <View>
                <View className="flex-row flex-wrap mb-4 bg-gray-50 p-2 rounded-md">
                  <View style={{ flex: 1, minWidth: 140, marginBottom: 8 }}>
                    <Text className="text-gray-500 text-xs">Coût exploitation</Text>
                    <Text className="font-medium flex-row items-center">
                      {formatCurrency(totalCost)}
                      <ExternalLink size={14} style={{ marginLeft: 4 }} />
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 140, marginBottom: 8 }}>
                    <Text className="text-gray-500 text-xs">Rendement prévu</Text>
                    <Text className="font-medium flex-row items-center">
                      {rendementProduits}
                      <ExternalLink size={14} style={{ marginLeft: 4 }} />
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 140, marginBottom: 8 }}>
                    <Text className="text-gray-500 text-xs">Revenu estimé</Text>
                    <Text className="font-medium flex-row items-center">
                      {formatCurrency(totalRendement)}
                      <ExternalLink size={14} style={{ marginLeft: 4 }} />
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 140, marginBottom: 8 }}>
                    <Text className="text-gray-500 text-xs">Bénéfice total</Text>
                    <Text className="font-medium">{formatCurrency(totalProfit)}</Text>
                  </View>
                </View>
                <View className="mb-4">
                  <View className="flex-row justify-between mb-1">
                    <Text className="font-medium">Progression du financement</Text>
                    <Text className="font-medium">
                      {formatCurrency(currentFunding)} / {formatCurrency(totalCost)}
                    </Text>
                  </View>
                  <ProgressBar progress={fundingProgress / 100} color="#22c55e" style={{ height: 8, borderRadius: 4 }} />
                </View>
                <Separator />
                <Text className="text-lg font-medium mb-2">Investissements</Text>
                <View className="border rounded-md bg-white">
                  {/* Header */}
                  <View className="flex-row bg-gray-100 border-b">
                    <Text className="flex-1 p-2 text-left text-sm font-semibold">Investisseur</Text>
                    <Text className="flex-1 p-2 text-right text-sm font-semibold">Montant</Text>
                    <Text className="flex-1 p-2 text-right text-sm font-semibold">Date</Text>
                    <Text className="flex-1 p-2 text-center text-sm font-semibold">En attente</Text>
                  </View>
                  {/* Body */}
                  {investments.length > 0 ? (
                    investments.map((inv) => {
                      const isPaid = inv.statut_paiement === 'payé' || inv.date_paiement;
                      const displayDate = isPaid ? inv.date_paiement : inv.date_decision_investir;
                      return (
                        <View
                          key={inv.id_investissement}
                          className={`flex-row border-b ${!isPaid ? 'bg-orange-100' : ''}`}
                        >
                          <Text className="flex-1 p-2 text-sm" numberOfLines={1} ellipsizeMode="tail">
                            {inv.investisseur?.nom} {inv.investisseur?.prenoms || ''}
                          </Text>
                          <Text className="flex-1 p-2 text-right text-sm" numberOfLines={1} ellipsizeMode="tail">
                            {inv.montant?.toLocaleString()} Ar
                          </Text>
                          <Text className="flex-1 p-2 text-right text-sm" numberOfLines={1} ellipsizeMode="tail">
                            {formatDate(displayDate)}
                          </Text>
                          <Text className="flex-1 p-2 text-center text-sm" numberOfLines={1} ellipsizeMode="tail">
                            {!isPaid ? "Oui" : ""}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <View>
                      <Text className="p-4 text-center text-sm text-gray-400">
                        Aucun investissement pour le moment
                      </Text>
                    </View>
                  )}
                  {/* Footer Total */}
                  {investments.length > 0 && (
                    <View className="flex-row border-t bg-gray-100">
                      <Text className="flex-1 p-2 font-medium">Total</Text>
                      <Text className="flex-1 p-2 text-right font-medium">
                        {investments.reduce((sum, inv) => sum + (inv.montant || 0), 0).toLocaleString()} Ar
                      </Text>
                      <Text className="flex-1 p-2"></Text>
                      <Text className="flex-1 p-2"></Text>
                    </View>
                  )}
                </View>
                {userRole === 'technicien' && project.statut === 'validé' && isFundingComplete && (
                  <View className="flex-row justify-end mt-4">
                    <Button onPress={handleStartProduction}>Lancer la production</Button>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'jalons' && (
              <View>
                {project.statut === 'en cours' ? (
                  <View>
                    <View className="border rounded-md bg-white">
                      {jalons.length > 0 ? (
                        jalons.map((jalon) => {
                          const status = getJalonStatus(jalon);
                          const rowStyle =
                            status === 'completed'
                              ? { backgroundColor: '#F2FCE2' }
                              : status === 'overdue'
                              ? { backgroundColor: '#ffcccc' }
                              : {};
                          return (
                            <View
                              key={`${jalon.id_projet}-${jalon.id_jalon_agricole}`}
                              className="flex-row items-center border-b px-2 py-2"
                              style={rowStyle}
                            >
                              <Text className="flex-1 text-sm" numberOfLines={1} ellipsizeMode="tail">
                                {jalon.culture?.id_culture.nom_culture || ''}
                              </Text>
                              <Text className="flex-1 text-sm" numberOfLines={1} ellipsizeMode="tail">
                                {jalon.jalon_agricole?.nom_jalon}
                              </Text>
                              <Text className="flex-1 text-sm" numberOfLines={1} ellipsizeMode="tail">
                                {formatDate(jalon.date_previsionnelle)}
                              </Text>
                              <Text className="flex-1 text-sm" numberOfLines={1} ellipsizeMode="tail">
                                {jalon.date_reelle ? formatDate(jalon.date_reelle) : ''}
                              </Text>
                              {userRole === 'technicien' && (
                                <View className="flex-1 items-center">
                                  {jalon.date_reelle ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onPress={() => setSelectedJalon(jalon)}
                                    >
                                      Voir le rapport
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onPress={() => setSelectedJalon(jalon)}
                                    >
                                      Marquer réalisé
                                    </Button>
                                  )}
                                </View>
                              )}
                            </View>
                          );
                        })
                      ) : (
                        <View className="p-4">
                          <Text className="text-center text-gray-500">Aucun jalon défini pour ce projet</Text>
                        </View>
                      )}
                    </View>
                    {userRole === 'technicien' && allJalonsCompleted() && (
                      <View className="flex-row justify-end mt-4">
                        <Button onPress={handleCompleteProject}>Terminer le projet</Button>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="p-8 items-center">
                    <Text className="text-gray-500">
                      {project.statut === 'terminé'
                        ? "Ce projet est terminé."
                        : "Le projet n'est pas encore en cours de production."}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
          <Button onPress={onClose} className="mt-4">Fermer</Button>
        </View>
      </View>

      {/* {selectedJalon && (
        <JalonReportDialog
          isOpen={!!selectedJalon}
          onClose={() => setSelectedJalon(null)}
          projectId={projectId}
          jalonId={selectedJalon.id_jalon_agricole}
          jalonName={selectedJalon.jalon_agricole?.nom_jalon}
          datePrevue={selectedJalon.date_previsionnelle}
          onSubmitSuccess={() => {
            fetchJalons();
            setSelectedJalon(null);
          }}
          readOnly={!!selectedJalon.date_reelle}
          initialData={selectedJalon}
        />
      )} */}

      {project?.terrain?.id_terrain && (
        <TerrainCardDialog
          isOpen={terrainDialogOpen}
          onClose={() => setTerrainDialogOpen(false)}
          terrainId={project.terrain.id_terrain}
        />
      )}
    </Modal>
  );
};

export { ProjectDetailsDialog };
