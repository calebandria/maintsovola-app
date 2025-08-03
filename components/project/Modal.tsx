import { 
  calculateProjectMetrics, 
  getJalonStatus, 
  areAllJalonsCompleted,
  startProjectProduction,
  completeProject,
  type ProjectDetails,
  type Investment,
  type ProjectJalon,
  useProjects,
  useDetails
} from "@/hooks/useProject";
import { useEffect, useState } from "react";
import { 
  ActivityIndicator, 
  Modal, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  FlatList
} from "react-native";
// import CreateProjectModal from "../CreateProjectModal";
import { ProjectMilestonesModal } from "../ProjectMilestones";
import { supabase } from "~/utils/supabase";
import { ProjectData } from "~/type/projectInterface";
import { useProjectData } from "@/hooks/useProject";
import CreateProjectModal from "../CreateProjectModal";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('fr-FR');
const formatCurrency = (amount: number) =>
  `${amount.toLocaleString('fr-FR')} Ar`;

type ModalDetailsProps = {
  projectId: number;
  isVisible: boolean;
  onClose: () => void;
  userProfile?: { userProfile: string; userName: string };
};

export const ModalDetails = ({ projectId, isVisible, onClose, userProfile }: ModalDetailsProps) => {
  // Utilisation du hook combiné pour toutes les données
  // const {projects} = useDetails(projectId)
  const { 
    project,
    investments, 
    jalons, 
    loading, 
    error,
    refetchAll,
    refetchProject,
    refetchInvestments,
    refetchJalons
  } = useProjectData(projectId);
  const projects = project

  // États locaux
  const [finJal, setFinJal] = useState<boolean>(false);
  const [modalModify, setmodalModify] = useState<boolean>(false);
  const [showJalons, setShowJalons] = useState<boolean>(false);
  const [load, setload] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Calcul des métriques si les données sont disponibles
  const metrics = projects && investments ? calculateProjectMetrics(projects, investments) : null;

  const ownerFullName = projects
    ? `${projects?.tantsaha?.nom ?? ''} ${projects?.tantsaha?.prenoms ?? ''}`.trim()
    : '';

  const canDelete =
    userProfile?.userProfile === 'simple' &&
    ownerFullName === userProfile?.userName;

  const canEdit =
    userProfile?.userProfile === 'superviseur' ||
    userProfile?.userProfile === 'technicien' ||
    canDelete;

  const isTechnicien = userProfile?.userProfile === 'technicien';
  const allJalonsCompleted = jalons ? areAllJalonsCompleted(jalons) : false;

  const handleDelete = async () => {
    if (!projects?.id_projet) return;
    Alert.alert(
      'Confirmer',
      'Voulez-vous vraiment supprimer ce projet ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setload(true);
            const { error } = await supabase
              .from('projet')
              .delete()
              .eq('id_projet', projects.id_projet);
            setload(false);
            if (!error) {
              Alert.alert('Succès', 'Projet supprimé');
              onClose();
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer le projet');
            }
          },
        },
      ]
    );
  };

  const handleStartProduction = async () => {
    if (!projects) return;
    
    Alert.alert(
      'Confirmer',
      'Voulez-vous lancer ce projet en production ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Lancer',
          onPress: async () => {
            try {
              setActionLoading(true);
              const cultures = projects.projet_culture?.map((pc:any) => ({ id_culture: pc.id_culture }));
              if (cultures)
                await startProjectProduction(projectId, cultures);
              await refetchAll(); // Recharger toutes les données
            } catch (error) {
              console.log("Error in estimate product : ", error)
              // L'erreur est déjà gérée dans startProjectProduction
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteProject = async () => {
    Alert.alert(
      'Confirmer',
      'Voulez-vous marquer ce projet comme terminé ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async () => {
            try {
              setActionLoading(true);
              await completeProject(projectId);
              await refetchProject(); // Recharger les données du projet
            } catch (error) {
              console.log("error at handlecomplete project:", error)
              // L'erreur est déjà gérée dans completeProject
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Composant pour afficher un investissement
  const InvestmentItem = ({ item }: { item: Investment }) => {
    const isPaid = item.statut_paiement === 'payé' || item.date_paiement;
    const displayDate = isPaid ? item.date_paiement : item.date_decision_investir;
    
    return (
      <View className={`p-3 border-b border-gray-200 ${!isPaid ? 'bg-orange-100' : 'bg-white'}`}>
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="font-semibold text-gray-800">
              {item.investisseur?.nom} {item.investisseur?.prenoms || ''}
            </Text>
            {displayDate ? <Text className="text-gray-600 text-sm">
              {formatDate(displayDate)}
            </Text>:<Text>Auccune date</Text>}
            {!isPaid && (
              <Text className="text-orange-600 text-xs font-medium">En attente de paiement</Text>
            )}
          </View>
          <Text className="font-bold text-green-700">
            {formatCurrency(item.montant)}
          </Text>
        </View>
      </View>
    );
  };

  // Composant pour afficher un jalon
  const JalonItem = ({ item }: { item: ProjectJalon }) => {
    const status = getJalonStatus(item);
    const statusColor = 
      status === 'completed' ? 'bg-green-100 border-green-300' : 
      status === 'overdue' ? 'bg-red-100 border-red-300' : 
      'bg-gray-50 border-gray-200';
    
    const statusText = 
      status === 'completed' ? 'Terminé' : 
      status === 'overdue' ? 'En retard' : 
      'En cours';

    return (
      <View className={`p-3 border-b border-gray-200 ${statusColor}`}>
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="font-semibold text-gray-800">
              {item.jalon_agricole?.nom_jalon}
            </Text>
            <Text className="text-gray-600 text-sm">
              Culture: {item.culture?.id_culture?.nom_culture}
            </Text>
            <Text className="text-gray-600 text-sm">
              Prévu: {formatDate(item.date_previsionnelle)}
            </Text>
            {item.date_reelle && (
              <Text className="text-gray-600 text-sm">
                Réalisé: {formatDate(item.date_reelle)}
              </Text>
            )}
          </View>
          <View className="items-end">
            <Text className={`text-xs font-medium px-2 py-1 rounded ${
              status === 'completed' ? 'bg-green-200 text-green-800' : 
              status === 'overdue' ? 'bg-red-200 text-red-800' : 
              'bg-gray-200 text-gray-800'
            }`}>
              {statusText}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Composant pour les métriques financières
  const FinancialMetrics = () => {
    if (!metrics) return null;

    return (
      <View className="bg-gray-50 p-4 rounded-lg mb-4">
        <Text className="text-lg font-bold text-gray-800 mb-3">Résumé Financier</Text>
        
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Coût d{"\'"}exploitation:</Text>
            <Text className="font-semibold">{formatCurrency(metrics.totalCost)}</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Financement actuel:</Text>
            <Text className="font-semibold text-blue-600">
              {formatCurrency(metrics.currentFunding)}
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Progression:</Text>
            <Text className={`font-semibold ${metrics.isFundingComplete ? 'text-green-600' : 'text-orange-600'}`}>
              {metrics.fundingProgress}%
            </Text>
          </View>
          
          {/* Barre de progression */}
          <View className="mt-2">
            <View className="bg-gray-200 rounded-full h-2">
              <View 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${Math.min(metrics.fundingProgress, 100)}%` }}
              />
            </View>
          </View>
          
          <View className="flex-row justify-between pt-2 border-t border-gray-300">
            <Text className="text-gray-600">Rendement prévu:</Text>
            <Text className="font-semibold text-green-600 text-right flex-1 ml-2">
              {metrics.rendementProduits}
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Revenu estimé:</Text>
            <Text className="font-semibold">{formatCurrency(metrics.totalEstimatedRevenue)}</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Bénéfice total:</Text>
            <Text className={`font-bold ${metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.totalProfit)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      {(load || actionLoading) && (
        <View className="absolute inset-0 bg-white/80 justify-center items-center z-50">
          <ActivityIndicator size={40} color="#009800" />
          <Text className="mt-2 text-gray-700">
            {load ? 'Suppression en cours…' : 'Action en cours…'}
          </Text>
        </View>
      )}

      {/* Modal principal */}
      <Modal visible={isVisible} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-4">
          <View className="rounded-xl bg-white p-6 border border-zinc-500 max-h-[90%]">
            {loading && (
              <View className="items-center py-4">
                <ActivityIndicator size={30} color="#009800" />
                <Text className="mt-2 text-gray-600">Chargement...</Text>
              </View>
            )}
            
            {error && (
              <View className="bg-red-100 p-3 rounded-lg mb-4">
                <Text className="text-red-600">{error}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-2xl font-bold text-gray-600 mb-4">
                Détails sur le projet : {projects?.titre}
              </Text>

              {/* Statut du projet */}
              {projects && (
                <View className="mb-4">
                  <View className={`px-3 py-1 rounded-full self-start ${
                    projects.statut === 'en attente' ? 'bg-yellow-200' :
                    projects.statut === 'validé' ? 'bg-blue-200' :
                    projects.statut === 'en cours' ? 'bg-green-200' :
                    projects.statut === 'terminé' ? 'bg-gray-200' : 'bg-gray-100'
                  }`}>
                    <Text className={`font-semibold ${
                      projects.statut === 'en attente' ? 'text-yellow-800' :
                      projects.statut === 'validé' ? 'text-blue-800' :
                      projects.statut === 'en cours' ? 'text-green-800' :
                      projects.statut === 'terminé' ? 'text-gray-800' : 'text-gray-600'
                    }`}>
                      {projects.statut.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Agriculteur */}
              <View className="mt-4">
                <Text className="font-semibold text-xl">Agriculteur :</Text>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text>{projects?.tantsaha?.nom} {projects?.tantsaha?.prenoms}</Text>
                  {projects?.tantsaha?.photo_profil ? (
                    <Image
                      source={{ uri: projects.tantsaha.photo_profil }}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <Image
                      source={{ uri: "/assets/anonymous.png" }}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                </View>
              </View>

              {/* Terrain */}
              <View className="mt-4">
                <Text className="text-xl font-semibold">Terrain :</Text>
                <View>
                  <Text>Nom : {projects?.terrain?.nom_terrain}</Text>
                  <Text>Surface : {projects?.surface_ha} Ha</Text>
                  <Text>
                    Localisation : {projects?.region?.nom_region}, {projects?.district?.nom_district}, {projects?.commune?.nom_commune}
                  </Text>
                </View>
              </View>

              {/* Cultures */}
              {projects?.projet_culture && projects.projet_culture.length > 0 && (
                <View className="mt-4">
                  <Text className="text-xl font-semibold">Cultures :</Text>
                  <View className="flex-row flex-wrap mt-2">
                    {projects.projet_culture.map((pc:any) => (
                      <View key={pc.id_projet_culture} className="bg-green-100 px-2 py-1 rounded-md mr-2 mb-2">
                        <Text className="text-green-800 text-sm">{pc.culture?.nom_culture}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Équipe */}
              {(projects?.superviseur || projects?.technicien) && (
                <View className="mt-4">
                  <Text className="text-xl font-semibold">Équipe Maintso Vola :</Text>
                  
                  {projects?.superviseur && (
                    <View className="flex-row items-center mt-2">
                      <Text className="text-gray-600 mr-2">Superviseur :</Text>
                      {projects.superviseur.photo_profil && (
                        <Image
                          source={{ uri: projects.superviseur.photo_profil }}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      )}
                      <Text className="font-medium">
                        {projects.superviseur.nom} {projects.superviseur.prenoms || ''}
                      </Text>
                    </View>
                  )}
                  
                  {projects?.technicien && (
                    <View className="flex-row items-center mt-2">
                      <Text className="text-gray-600 mr-2">Technicien :</Text>
                      {projects.technicien.photo_profil && (
                        <Image
                          source={{ uri: projects.technicien.photo_profil }}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      )}
                      <Text className="font-medium">
                        {projects.technicien.nom} {projects.technicien.prenoms || ''}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Dates importantes */}
              {(projects?.date_lancement || projects?.date_fin) && (
                <View className="mt-4">
                  <Text className="text-xl font-semibold">Dates importantes :</Text>
                  {projects.date_lancement && (
                    <Text className="text-gray-600">
                      Lancement : {formatDate(projects.date_lancement)}
                    </Text>
                  )}
                  {projects.date_fin && (
                    <Text className="text-gray-600">
                      Fin : {formatDate(projects.date_fin)}
                    </Text>
                  )}
                </View>
              )}

              {/* Description */}
              {projects?.description && (
                <View className="mt-4">
                  <Text className="text-xl font-semibold">Description :</Text>
                  <Text className="text-gray-600 mt-1">{projects.description}</Text>
                </View>
              )}

              {/* Boutons d'action selon le rôle et le statut */}
              {isTechnicien && projects && (
                <View className="mt-4">
                  {projects.statut === 'validé' && metrics?.isFundingComplete && (
                    <TouchableOpacity 
                      onPress={handleStartProduction}
                      className="bg-green-600 p-3 rounded-lg mb-2"
                      disabled={actionLoading}
                    >
                      <Text className="text-white font-bold text-center">
                        Lancer la production
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {projects.statut === 'en cours' && allJalonsCompleted && (
                    <TouchableOpacity 
                      onPress={handleCompleteProject}
                      className="bg-blue-600 p-3 rounded-lg mb-2"
                      disabled={actionLoading}
                    >
                      <Text className="text-white font-bold text-center">
                        Terminer le projet
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Boutons principaux */}
              <View className="flex flex-row items-center justify-around text-base tracking-wide mt-6">
                <TouchableOpacity onPress={onClose} className="p-4 items-center bg-yellow-500 rounded-lg px-6">
                  <Text className="font-semibold">Fermer</Text>
                </TouchableOpacity>
                {projects?.statut === "en attente" && 
                <TouchableOpacity 
                  onPress={() => canEdit ? setmodalModify(true) : handleDelete()} 
                  className="p-3 items-center flex flex-row bg-zinc-200 rounded-lg px-6"
                >
                  <Text className={`${canEdit ? 'text-green-700' : 'text-red-500'} font-bold`}>
                    {canEdit ? `Modifier` : `Supprimer`}
                  </Text>
                </TouchableOpacity>
                }
                {canEdit && projects?.statut === "en attente" && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        "Confirmation",
                        "Voulez-vous valider ce projet et passer son statut à 'en cours' ?",
                        [
                          {
                            text: "Annuler",
                            style: "cancel",
                            onPress: () => console.log("Mise à jour annulée"),
                          },
                          {
                            text: "Valider",
                            style: "default",
                            onPress: async () => {
                              try {
                                const { data, error } = await supabase
                                  .from('projet')
                                  .update({ status: 'en cours' })
                                  .eq('id', projects.id_projet);

                                if (error) {
                                  Alert.alert("Erreur", `Échec de la mise à jour: ${error.message}`);
                                  return;
                                }
                                Alert.alert("Succès", "Le projet a été validé avec succès !");
                                console.log("Mise à jour réussie:", data);
                              } catch (err) {
                                Alert.alert("Erreur", "Une erreur inattendue est survenue.");
                                console.error(err);
                              }
                            },
                          },
                        ],
                        { cancelable: true }
                      );
                    }}
                    className="p-4 items-center bg-green-700 rounded-lg px-6"
                  >
                    <Text className="font-semibold">Valider</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Onglets */}
              <View className="bg-gray-300 min-h-8 rounded-lg p-1 mt-4">
                <View className="rounded flex flex-row justify-around">
                  <TouchableOpacity className="p-1" onPress={() => setFinJal(false)}>
                    <Text className={`text-2xl py-1 px-4 rounded-md w-full ${!finJal && 'bg-white'}`}>
                      Financement
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="p-1" onPress={() => setFinJal(true)}>
                    <Text className={`text-2xl py-1 px-4 rounded-md w-full ${finJal && 'bg-white'}`}>
                      Jalons & Production
                    </Text>Nou
                  </TouchableOpacity>
                </View>
              </View>

              {/* Contenu onglet */}
              <View className="bg-white rounded-lg mt-1 min-h-20">
                {finJal ? (
                  // Onglet Jalons & Production
                  <View className="p-4">
                    {projects?.statut === 'en cours' ? (
                      <View>
                        <Text className="text-lg font-bold text-gray-800 mb-3">
                          Jalons du projet ({jalons?.length || 0})
                        </Text>
                        
                        {/* Statistiques des jalons */}
                        {jalons && jalons.length > 0 && (
                          <View className="bg-gray-50 p-3 rounded-lg mb-4">
                            <View className="flex-row justify-between">
                              <Text className="text-gray-600">Terminés:</Text>
                              <Text className="font-semibold text-green-600">
                                {jalons.filter((j:any) => j.date_reelle).length}
                              </Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-gray-600">En retard:</Text>
                              <Text className="font-semibold text-red-600">
                                {jalons.filter((j:any) => getJalonStatus(j) === 'overdue').length}
                              </Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-gray-600">Progression:</Text>
                              <Text className="font-semibold">
                                {jalons.length > 0 ? Math.round((jalons.filter((j:any) => j.date_reelle).length / jalons.length) * 100) : 0}%
                              </Text>
                            </View>
                          </View>
                        )}
                        
                        {jalons && jalons.length > 0 ? (
                          <FlatList
                            data={jalons}
                            keyExtractor={(item) => `${item.id_projet}-${item.id_jalon_agricole}`}
                            renderItem={({ item }) => <JalonItem item={item} />}
                            scrollEnabled={false}
                            className="border border-gray-200 rounded-lg"
                          />
                        ) : (
                          <View className="p-4 bg-gray-50 rounded-lg">
                            <Text className="text-gray-500 text-center">
                              Aucun jalon défini pour ce projet
                            </Text>
                          </View>
                        )}
                        
                        <TouchableOpacity
                          onPress={() => setShowJalons(true)}
                          className="p-3 bg-green-600 rounded-lg items-center mt-4"
                        >
                          <Text className="text-white font-bold">Voir les détails des jalons</Text>
                        </TouchableOpacity>
                      </View>
                    ) : projects?.statut === 'terminé' ? (
                      <View className="p-4 bg-green-50 rounded-lg">
                        <Text className="text-green-800 text-center font-semibold">
                          ✅ Ce projet est terminé
                        </Text>
                        {projects.date_fin && (
                          <Text className="text-green-600 text-center mt-2">
                            Terminé le {formatDate(projects.date_fin)}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View className="p-4 bg-gray-50 rounded-lg">
                        <Text className="text-gray-500 text-center">
                          Le projet n{"\'"}est pas encore en cours de production
                        </Text>
                        {projects?.statut === 'validé' && !metrics?.isFundingComplete && (
                          <Text className="text-orange-600 text-center mt-2 text-sm">
                            En attente du financement complet pour démarrer
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ) : (
                  // Onglet Financement
                  <View className="p-4">
                    <Text className="text-lg font-bold text-gray-800 mb-3">
                      Financement du projet
                    </Text>
                    
                    {/* Métriques financières */}
                    <FinancialMetrics />
                    
                    {/* Liste des investissements */}
                    <Text className="text-lg font-bold text-gray-800 mb-3">
                      Investissements ({investments?.length || 0})
                    </Text>
                    
                    {investments && investments.length > 0 ? (
                      <View>
                        <FlatList
                          data={investments}
                          keyExtractor={(item) => item.id_investissement.toString()}
                          renderItem={({ item }) => <InvestmentItem item={item} />}
                          scrollEnabled={false}
                          className="border border-gray-200 rounded-lg mb-4"
                        />
                        
                        {/* Total des investissements */}
                        <View className="bg-gray-100 p-3 rounded-lg">
                          <View className="flex-row justify-between">
                            <Text className="font-bold text-gray-800">Total investi:</Text>
                            <Text className="font-bold text-green-600">
                              {metrics ? formatCurrency(metrics.currentFunding) : '0 Ar'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View className="p-4 bg-gray-50 rounded-lg">
                        <Text className="text-gray-500 text-center">
                          Aucun investissement pour le moment
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de modification */}
      <ModalAddStyled 
        project={projects} 
        onClose={() => {
          setmodalModify(false);
          refetchProject(); // Recharger après modification
        }} 
        userProfile={userProfile} 
        isVisible={modalModify}
      />

      {/* Modal des jalons */}
      <ProjectMilestonesModal
        projectId={projectId}
        isVisible={showJalons}
        onClose={() => {
          setShowJalons(false);
          refetchJalons(); // Recharger les jalons après fermeture
        }}
      />
    </>
  );
};

type CreateModalProps = {
  project?: ProjectData | null;
  onClose: () => void;
  isVisible: boolean;
  userProfile?: { userProfile: string; userName: string };
};

export const ModalAddStyled = ({ project, onClose, isVisible, userProfile }: CreateModalProps) => {
  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View className="flex-1 justify-center bg-black/50 px-4">
        <View className="rounded-xl bg-white p-6 border border-zinc-500">
          <ScrollView>
            <CreateProjectModal project={project} onClose={onClose} userProfile={userProfile} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};