import { useDetails } from "~/hooks/useProject";
import { ProjectData } from "~/type/projectInterface";
import { useState } from "react";
import { ActivityIndicator, Modal, View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import CreateProjectModal from "../CreateProjectModal";
import { ProjectMilestonesModal } from "../ProjectMilestones";

type ModalDetailsProps = {
  projectId: number;
  isVisible: boolean;
  onClose: () => void;
  userProfile?: { userProfile: string; userName: string };
};


export const ModalDetails = ({ projectId, isVisible, onClose, userProfile }: ModalDetailsProps) => {
  const { projects, loading } = useDetails(projectId);
  const [finJal, setFinJal] = useState<boolean>(false);
  const [modalModify, setmodalModify] = useState<boolean>(false)

  // ajout d’un état pour empiler le modal jalons
  const [showJalons, setShowJalons] = useState<boolean>(false);

  return (
    <>
      {/* Modal principal */}
      <Modal visible={isVisible} transparent animationType="slide">
        {loading && <ActivityIndicator size={30} color="#009800" className="mt-5" />}
        <View className="flex-1 justify-center bg-black/50 px-4">
          <View className="rounded-xl bg-white p-6 border border-zinc-500">
            <Text className="text-2xl font-bold text-gray-600">Détails sur le projet : {projects?.titre}</Text>

            {/* Agriculteur */}
            <View className="mt-4">
              <Text className="font-semibold text-xl">Agriculteur :</Text>
              <View className="mt-2 flex-row items-center justify-between">
                <Text>{projects?.tantsaha?.nom} {projects?.tantsaha?.prenoms}</Text>
                {projects?.tantsaha?.photo_profil && (
                  <Image
                    source={{ uri: projects.tantsaha.photo_profil }}
                    width={50}
                    height={50}
                    className="rounded-full"
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

            {/* Description */}
            <Text className="mt-4">Description : {projects?.description}</Text>

            {/* Boutons principaux */}
            <View className="flex flex-row items-center justify-around text-base tracking-wide mt-6">
              <TouchableOpacity onPress={onClose} className="p-3 items-center bg-yellow-500 rounded-lg px-6">
                <Text className="font-semibold">Fermer</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setmodalModify(true)} className="p-3 items-center flex flex-row bg-zinc-200 rounded-lg px-6">
                <Text className="text-green-700 font-bold">Modifier</Text>
              </TouchableOpacity>
            </View>
            <ModalAddStyled project={projects} onClose={() => setmodalModify(false)} userProfile={userProfile} isVisible={modalModify}/>

            {/* Onglets */}
            <View className="bg-gray-300 min-h-8 rounded-lg p-1 mt-4">
              <View className="rounded flex flex-row justify-around">
                <TouchableOpacity className="p-1" onPress={() => setFinJal(false)}>
                  <Text className={`text-2xl py-1 px-4 rounded-md w-full ${!finJal && 'bg-white'}`}>Financement</Text>
                </TouchableOpacity>
                <TouchableOpacity className="p-1" onPress={() => setFinJal(true)}>
                  <Text className={`text-2xl py-1 px-4 rounded-md w-full ${finJal && 'bg-white'}`}>Jalons & Production</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Contenu onglet */}
            <View className="bg-white rounded-lg p-4 mt-1 min-h-20">
              {finJal ? (
                <TouchableOpacity
                  onPress={() => setShowJalons(true)}
                  className="p-3 bg-green-600 rounded-lg items-center"
                >
                  <Text className="text-white font-bold">Voir les jalons du projet</Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-gray-500">Informations de financement à venir…</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Empilement du modal jalons */}
      <ProjectMilestonesModal
        projectId={projectId}
        isVisible={showJalons}
        onClose={() => setShowJalons(false)}
      />
    </>
  );
};


type CreateModalProps = {
  project?: any;
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