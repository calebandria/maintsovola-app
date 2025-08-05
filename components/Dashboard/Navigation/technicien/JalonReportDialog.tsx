// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   Modal,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   TextInput as RNTextInput,
//   ActivityIndicator,
//   Platform,
// } from "react-native";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "~/hooks/use-toast";
// import { sendGroupedNotification } from "@/lib/groupedNotifications";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import * as ImagePicker from "expo-image-picker";
// import { Image } from "expo-image";
// import { Button } from "~/components/ui/Button";

// interface JalonReportDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   projectId: number;
//   jalonId: number;
//   jalonName: string;
//   datePrevue: string;
//   onSubmitSuccess?: () => void;
//   readOnly?: boolean;
//   initialData?: {
//     rapport?: string;
//     dateReelle?: string;
//     heureDebut?: string;
//     heureFin?: string;
//     photos?: string[];
//   };
// }

// const JalonReportDialog: React.FC<JalonReportDialogProps> = ({
//   isOpen,
//   onClose,
//   projectId,
//   jalonId,
//   jalonName,
//   datePrevue,
//   onSubmitSuccess,
//   readOnly = false,
//   initialData = {},
// }) => {
//   const [rapport, setRapport] = useState(initialData.rapport || "");
//   const [dateReelle, setDateReelle] = useState(initialData.dateReelle || datePrevue);
//   const [heureDebut, setHeureDebut] = useState(initialData.heureDebut || "");
//   const [heureFin, setHeureFin] = useState(initialData.heureFin || "");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [photoUrls, setPhotoUrls] = useState<string[]>(initialData.photos || []);
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [showTimeStartPicker, setShowTimeStartPicker] = useState(false);
//   const [showTimeEndPicker, setShowTimeEndPicker] = useState(false);

//   const handleSubmit = async () => {
//     if (!rapport.trim()) {
//       toast.show("Veuillez rédiger un rapport d'intervention", { type: "error" });
//       return;
//     }

//     if (heureDebut && heureFin && heureDebut >= heureFin) {
//       toast.show("L'heure de fin doit être postérieure à l'heure de début", {
//         type: "error",
//       });
//       return;
//     }

//     try {
//       setIsSubmitting(true);

//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error("Utilisateur non connecté");

//       const photosString = photoUrls.length > 0 ? JSON.stringify(photoUrls) : null;

//       const { error: updateError } = await supabase
//         .from("jalon_projet")
//         .update({
//           date_reelle: dateReelle,
//           heure_debut: heureDebut || null,
//           heure_fin: heureFin || null,
//           rapport_jalon: rapport,
//           photos_jalon: photosString,
//         })
//         .eq("id_projet", projectId)
//         .eq("id_jalon_agricole", jalonId);

//       if (updateError) throw updateError;

//       const { data: projectData, error: projectError } = await supabase
//         .from("projet")
//         .select("id_tantsaha")
//         .eq("id_projet", projectId)
//         .single();

//       if (projectError) {
//         console.error("Error fetching project data:", projectError);
//       } else if (projectData) {
//         try {
//           await sendGroupedNotification({
//             senderId: user.id,
//             recipientId: projectData.id_tantsaha,
//             entityType: "jalon",
//             entityId: jalonId,
//             action: "comment",
//             projetId: projectId,
//           });
//         } catch (notifError) {
//           console.error("Error sending notification to project owner:", notifError);
//         }
//       }

//       try {
//         const { data: investorsData, error: investorsError } = await supabase
//           .from("investissement")
//           .select("id_investisseur")
//           .eq("id_projet", projectId);

//         if (investorsError) {
//           console.error("Error fetching investors:", investorsError);
//         } else if (investorsData) {
//           for (const investor of investorsData) {
//             try {
//               await sendGroupedNotification({
//                 senderId: user.id,
//                 recipientId: investor.id_investisseur,
//                 entityType: "jalon",
//                 entityId: jalonId,
//                 action: "comment",
//                 projetId: projectId,
//               });
//             } catch (notifError) {
//               console.error("Error sending notification to investor:", notifError);
//             }
//           }
//         }
//       } catch (error) {
//         console.error("Error processing investor notifications:", error);
//       }

//       toast.show("Rapport d'intervention enregistré avec succès", {
//         type: "success",
//       });

//       if (onSubmitSuccess) {
//         onSubmitSuccess();
//       }
//       onClose();
//     } catch (error) {
//       console.error("Error submitting report:", error);
//       toast.show("Impossible d'enregistrer le rapport", { type: "error" });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleAddPhotos = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permissionResult.granted) {
//         toast.show("Permission to access media library is required", { type: "error" });
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsMultipleSelection: true,
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets) {
//         const uploadedUrls = await Promise.all(
//           result.assets.map(async (asset) => {
//             const fileExt = asset.uri.split(".").pop();
//             const fileName = `${projectId}-${jalonId}-${Date.now()}.${fileExt}`;
//             const filePath = `project-photos/${fileName}`;

//             // React Native: upload expects a File/Blob, not FormData
//             const response = await fetch(asset.uri);
//             const blob = await response.blob();

//             const { error: uploadError } = await supabase.storage
//               .from("project-photos")
//               .upload(filePath, blob, {
//                 contentType: asset.type || 'image/jpeg',
//                 upsert: true,
//               });

//             if (uploadError) throw uploadError;

//             const { data: publicData } = supabase.storage
//               .from("project-photos")
//               .getPublicUrl(filePath);

//             return publicData.publicUrl;
//           })
//         );
//         setPhotoUrls((prev) => [...prev, ...uploadedUrls]);
//       }
//     } catch (error) {
//       console.error("Error uploading photos:", error);
//       toast.show("Erreur lors de l'upload des photos", { type: "error" });
//     }
//   };

//   const handleRemovePhoto = (index: number) => {
//     Alert.alert(
//       "Supprimer la photo",
//       "Êtes-vous sûr de vouloir supprimer cette photo?",
//       [
//         {
//           text: "Annuler",
//           style: "cancel",
//         },
//         {
//           text: "Supprimer",
//           onPress: () => {
//             setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
//           },
//         },
//       ]
//     );
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("fr-FR");
//   };

//   const formatTime = (timeString: string) => {
//     if (!timeString) return "";
//     const [hours, minutes] = timeString.split(":");
//     return `${hours}:${minutes}`;
//   };

//   return (
//     <Modal
//       visible={isOpen}
//       animationType="slide"
//       transparent={false}
//       onRequestClose={onClose}
//     >
//       <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
//         <View style={{ marginBottom: 24 }}>
//           <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#222' }}>
//             {readOnly ? `Rapport - ${jalonName}` : `Rapport d'intervention - ${jalonName}`}
//           </Text>
//         </View>

//         {/* Date prévue */}
//         <View style={{ marginBottom: 16 }}>
//           <Text style={{ fontSize: 14, fontWeight: '500', color: '#222' }}>Date prévue</Text>
//           <RNTextInput
//             style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, color: '#222', marginTop: 4, opacity: readOnly ? 0.7 : 1 }}
//             value={formatDate(datePrevue)}
//             editable={false}
//           />
//         </View>

//         {/* Date réelle */}
//         <View style={{ marginBottom: 16 }}>
//           <Text style={{ fontSize: 14, fontWeight: '500', color: '#222' }}>Date d'intervention réelle</Text>
//           <TouchableOpacity
//             onPress={() => !readOnly && setShowDatePicker(true)}
//             disabled={readOnly}
//           >
//             <RNTextInput
//               style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, color: '#222', borderWidth: 1, borderColor: '#e5e7eb', marginTop: 4, opacity: readOnly ? 0.7 : 1 }}
//               value={formatDate(dateReelle)}
//               editable={false}
//             />
//           </TouchableOpacity>
//         </View>
//         {showDatePicker && (
//           <DateTimePicker
//             value={dateReelle ? new Date(dateReelle) : new Date()}
//             mode="date"
//             display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//             onChange={(event, selectedDate) => {
//               setShowDatePicker(false);
//               if (selectedDate) {
//                 setDateReelle(selectedDate.toISOString().split("T")[0]);
//               }
//             }}
//           />
//         )}

//         {/* Heures */}
//         <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
//           <View style={{ flex: 1, marginRight: 8 }}>
//             <Text style={{ fontSize: 14, fontWeight: '500', color: '#222' }}>Heure de début</Text>
//             <TouchableOpacity
//               onPress={() => !readOnly && setShowTimeStartPicker(true)}
//               disabled={readOnly}
//             >
//               <RNTextInput
//                 style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, color: '#222', borderWidth: 1, borderColor: '#e5e7eb', marginTop: 4, opacity: readOnly ? 0.7 : 1 }}
//                 value={formatTime(heureDebut)}
//                 editable={false}
//               />
//             </TouchableOpacity>
//             {showTimeStartPicker && (
//               <DateTimePicker
//                 value={heureDebut ? new Date(`1970-01-01T${heureDebut}`) : new Date()}
//                 mode="time"
//                 display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                 onChange={(event, selectedTime) => {
//                   setShowTimeStartPicker(false);
//                   if (selectedTime) {
//                     const hours = selectedTime.getHours().toString().padStart(2, "0");
//                     const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
//                     setHeureDebut(`${hours}:${minutes}`);
//                   }
//                 }}
//               />
//             )}
//           </View>
//           <View style={{ flex: 1, marginLeft: 8 }}>
//             <Text style={{ fontSize: 14, fontWeight: '500', color: '#222' }}>Heure de fin</Text>
//             <TouchableOpacity
//               onPress={() => !readOnly && setShowTimeEndPicker(true)}
//               disabled={readOnly}
//             >
//               <RNTextInput
//                 style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, color: '#222', borderWidth: 1, borderColor: '#e5e7eb', marginTop: 4, opacity: readOnly ? 0.7 : 1 }}
//                 value={formatTime(heureFin)}
//                 editable={false}
//               />
//             </TouchableOpacity>
//             {showTimeEndPicker && (
//               <DateTimePicker
//                 value={heureFin ? new Date(`1970-01-01T${heureFin}`) : new Date()}
//                 mode="time"
//                 display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                 onChange={(event, selectedTime) => {
//                   setShowTimeEndPicker(false);
//                   if (selectedTime) {
//                     const hours = selectedTime.getHours().toString().padStart(2, "0");
//                     const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
//                     setHeureFin(`${hours}:${minutes}`);
//                   }
//                 }}
//               />
//             )}
//           </View>
//         </View>

//         {/* Rapport */}
//         <View style={{ marginBottom: 16 }}>
//           <Text style={{ fontSize: 14, fontWeight: '500', color: '#222' }}>Rapport d'intervention</Text>
//           <RNTextInput
//             style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, color: '#222', borderWidth: 1, borderColor: '#e5e7eb', minHeight: 100, marginTop: 4, opacity: readOnly ? 0.7 : 1 }}
//             value={rapport}
//             onChangeText={setRapport}
//             multiline
//             numberOfLines={5}
//             placeholder="Décrivez les actions réalisées, les observations, etc."
//             editable={!readOnly}
//           />
//         </View>

//         {/* Photos */}
//         <View style={{ marginBottom: 16 }}>
//           <Text style={{ fontSize: 14, fontWeight: '500', color: '#222' }}>Photos du terrain</Text>
//           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
//             {photoUrls.map((url, index) => (
//               <View key={index} style={{ position: 'relative', width: 96, height: 96, marginRight: 8, marginBottom: 8 }}>
//                 <Image
//                   source={{ uri: url }}
//                   style={{ width: '100%', height: '100%', borderRadius: 8 }}
//                   contentFit="cover"
//                 />
//                 {!readOnly && (
//                   <TouchableOpacity
//                     style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#ef4444cc', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
//                     onPress={() => handleRemovePhoto(index)}
//                   >
//                     <Text style={{ color: '#fff', fontWeight: 'bold' }}>×</Text>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             ))}
//           </View>
//           {!readOnly && (
//             <Button
//               variant="outline"
//               onPress={handleAddPhotos}
//               style={{ marginTop: 8 }}
//               icon="camera"
//             >
//               Ajouter des photos
//             </Button>
//           )}
//         </View>

//         {/* Actions */}
//         <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
//           {!readOnly ? (
//             <>
//               <Button
//                 variant="outline"
//                 onPress={onClose}
//                 disabled={isSubmitting}
//                 style={{ flex: 1, marginRight: 8 }}
//               >
//                 Annuler
//               </Button>
//               <Button
//                 onPress={handleSubmit}
//                 disabled={isSubmitting}
//                 style={{ flex: 1 }}
//               >
//                 {isSubmitting ? "Enregistrement..." : "Enregistrer le rapport"}
//               </Button>
//             </>
//           ) : (
//             <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>
//               Fermer
//             </Button>
//           )}
//         </View>
//       </ScrollView>
//     </Modal>
//   );
// };

// export default JalonReportDialog;