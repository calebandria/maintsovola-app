// import React, { useState, useEffect, useRef } from "react";
// import { useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";
// import { Button } from "~/components/ui/button";
// import { Form } from "~/components/ui/form";
// import { supabase } from "~/integrations/supabase/client";
// import { TerrainFormData, convertFormDataToTerrainData } from "~/types/terrainForm";
// import { TerrainData } from "~/types/terrain";
// import { Loader2 } from "lucide-react";
// import { toast } from "sonner";
// import ValidationForm from "./ValidationForm";
// import TerrainFormFields from "~/components/terrain/TerrainFormFields";
// import { sendNotification } from "~/types/notification";

// interface TerrainFormProps {
//   initialData?: TerrainData;
//   onSubmit: (data: Partial<TerrainData>) => void;
//   onCancel: () => void;
//   userId: string;
//   userRole?: string;
//   agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
//   techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
//   isValidationMode?: boolean;
//   onSubmitSuccess?: (terrain: TerrainData) => void;
// }

// const terrainSchema = yup.object({
//   nom_terrain: yup.string().required("Le nom du terrain est obligatoire"),
//   surface_proposee: yup.number().required("La surface est obligatoire").positive("La surface doit être positive"),
//   id_region: yup.string().required("La région est obligatoire"),
//   id_district: yup.string().required("Le district est obligatoire"),
//   id_commune: yup.string().required("La commune est obligatoire"),
//   acces_eau: yup.boolean().default(false),
//   acces_route: yup.boolean().default(false),
//   id_tantsaha: yup.string().optional(),
// }).required();

// const validationSchema = yup.object({
//   surface_validee: yup.number().required("La surface validée est obligatoire").positive("La surface doit être positive"),
//   date_validation: yup.string().required("La date de validation est obligatoire"),
//   rapport_validation: yup.string().required("Le rapport de validation est obligatoire"),
//   validation_decision: yup.string().required("Une décision est requise").oneOf(['valider', 'rejetter'], "Décision invalide"),
// }).required();

// const TerrainForm: React.FC<TerrainFormProps> = ({
//   initialData,
//   onSubmit,
//   onCancel,
//   userId,
//   userRole,
//   agriculteurs = [],
//   techniciens = [],
//   isValidationMode = false,
//   onSubmitSuccess
// }) => {
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [polygonCoordinates, setPolygonCoordinates] = useState<number[][]>([]);
//   const [validationPhotos, setValidationPhotos] = useState<File[]>([]);
//   const [photoValidationUrls, setPhotoValidationUrls] = useState<string[]>([]);
//   const [photos, setPhotos] = useState<File[]>([]);
//   const [photoUrls, setPhotoUrls] = useState<string[]>([]);
//   const [isUploading, setIsUploading] = useState(false);
//   const [overlapTerrains, setOverlapTerrains] = useState<TerrainData[] | null>(null);
//   const [checkingOverlap, setCheckingOverlap] = useState(false);
//   const [isEditMode, setIsEditMode] = useState(!!initialData);

//   const formSchema = isValidationMode ? validationSchema : terrainSchema;

//   const form = useForm({
//     resolver: yupResolver(formSchema as any),
//     defaultValues: {
//       id_terrain: initialData?.id_terrain,
//       nom_terrain: initialData?.nom_terrain || "",
//       surface_proposee: initialData?.surface_proposee || 1,
//       surface_validee: initialData?.surface_validee || initialData?.surface_proposee || 1,
//       id_region: initialData?.id_region?.toString() || "",
//       id_district: initialData?.id_district?.toString() || "",
//       id_commune: initialData?.id_commune?.toString() || "",
//       acces_eau: initialData?.acces_eau || false,
//       acces_route: initialData?.acces_route || false,
//       id_tantsaha: userRole === 'simple' ? userId : initialData?.id_tantsaha,
//       photos: initialData?.photos || '',
//       date_validation: initialData?.date_validation || new Date().toISOString().split('T')[0],
//       rapport_validation: initialData?.rapport_validation || '',
//       photos_validation: initialData?.photos_validation || '',
//       validation_decision: initialData?.validation_decision || 'valider',
//     }
//   });
//   console.log('default data terrain to load', initialData);
//   useEffect(() => {
//     if (initialData) {
//       if (initialData.geom) {
//         try {
//           const geomData = typeof initialData.geom === 'string'
//             ? JSON.parse(initialData.geom)
//             : initialData.geom;

//           if (geomData && geomData.type === 'Polygon' && geomData.coordinates && geomData.coordinates[0]) {
//             setPolygonCoordinates(geomData.coordinates[0]);
//           }
//         } catch (error) {
//           console.error("Error processing polygon geometry:", error);
//         }
//       }

//       if (initialData.photos) {
//         try {
//           const photosArray = typeof initialData.photos === 'string'
//             ? initialData.photos.split(',').filter(url => url.trim() !== '')
//             : Array.isArray(initialData.photos) ? initialData.photos.filter(url => url && url.trim() !== '') : [];

//           setPhotoUrls(photosArray);
//         } catch (error) {
//           console.error("Error processing photos:", error);
//         }
//       }

//       if (initialData.photos_validation) {
//         try {
//           const photosArray = typeof initialData.photos_validation === 'string'
//             ? initialData.photos_validation.split(',').filter(url => url.trim() !== '')
//             : Array.isArray(initialData.photos_validation) ? initialData.photos_validation.filter(url => url && url.trim() !== '') : [];

//           setPhotoValidationUrls(photosArray);
//         } catch (error) {
//           console.error("Error processing validation photos:", error);
//         }
//       }
//     }
//   }, [initialData]);

//   const uploadPhotos = async (photos: File[], folder: string = 'terrain-photos'): Promise<string[]> => {
//     if (photos.length === 0) return [];

//     setIsUploading(true);
//     const uploadedUrls: string[] = [];

//     try {
//       for (const photo of photos) {
//         const fileExt = photo.name.split('.').pop();
//         const fileName = `terrain-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
//         const filePath = `${folder}/${fileName}`;

//         const { error: uploadError } = await supabase.storage
//           .from('project-photos')
//           .upload(filePath, photo);

//         if (uploadError) {
//           console.error("Error uploading photo:", uploadError);
//           continue;
//         }

//         const { data: publicUrlData } = supabase.storage
//           .from('project-photos')
//           .getPublicUrl(filePath);

//         if (publicUrlData) {
//           uploadedUrls.push(publicUrlData.publicUrl);
//         }
//       }

//       return uploadedUrls;
//     } catch (error) {
//       console.error("Error in photo upload process:", error);
//       return [];
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const checkPolygonOverlap = async (geojson: any, idToOmit?: number) => {
//     setCheckingOverlap(true);

//     try {

//       const query = supabase.rpc('check_terrain_overlap', {
//         geom_input: geojson,
//         terrain_to_omit: idToOmit || null
//       });

//       const { data, error } = await query;

//       setCheckingOverlap(false);

//       if (error) {
//         console.error("Erreur vérification chevauchement :", error);
//         toast.error("Erreur lors de la vérification du chevauchement des terrains.");
//         return [];
//       }
//       return data || [];
//     } catch (err) {
//       console.error("Exception lors de la vérification du chevauchement:", err);
//       setCheckingOverlap(false);
//       toast.error("Erreur technique lors de la vérification du chevauchement.");
//       return [];
//     }
//   };

//   const onSubmitHandler = async (data: any) => {
//     setIsSubmitting(true);
//     try {
//       if (!isValidationMode) {
//         const geojson = {
//           type: "Polygon",
//           coordinates: [
//             polygonCoordinates.map(coord =>
//               Array.isArray(coord) ? [coord[0], coord[1]] : [0, 0]
//             )
//           ]
//         };

//         const overlap = await checkPolygonOverlap(geojson, isEditMode && initialData?.id_terrain ? initialData.id_terrain : undefined);
//         if (overlap && overlap.length > 0) {
//           setOverlapTerrains(overlap);
//           setIsSubmitting(false);
//           return;
//         }

//         data.geom = polygonCoordinates;
//       }

//       data.surface_proposee = parseFloat(data.surface_proposee.toFixed(2));
//       if (data.surface_validee) {
//         data.surface_validee = parseFloat(data.surface_validee.toFixed(2));
//       }

//       const terrainOwnerId = userRole === 'simple' ? userId :
//                              userRole === 'technicien' || userRole === 'superviseur' ?
//                              (data.id_tantsaha || userId) : userId;

//       const terrainData = convertFormDataToTerrainData({...data} as TerrainFormData);
//       terrainData.id_tantsaha = terrainOwnerId;

//       if (isValidationMode) {
//         const uploadedValidationPhotos = await uploadPhotos(validationPhotos, 'terrain-validation-photos');

//         const existingValidationPhotoUrls = photoValidationUrls.filter(url => !url.startsWith('blob:'));
//         const allValidationPhotoUrls = [...existingValidationPhotoUrls, ...uploadedValidationPhotos];

//         terrainData.photos_validation = allValidationPhotoUrls.join(',');
//         terrainData.statut = data.validation_decision === 'valider';

//         if (terrainData.date_validation && typeof terrainData.date_validation !== 'string') {
//           terrainData.date_validation = String(terrainData.date_validation);
//         }

//         const { error } = await supabase
//           .from('terrain')
//           .update({
//             surface_validee: terrainData.surface_validee,
//             photos_validation: String(terrainData.photos_validation),
//             statut: terrainData.statut,
//             date_validation: terrainData.date_validation,
//             rapport_validation: terrainData.rapport_validation,
//             validation_decision: terrainData.validation_decision
//           })
//           .eq('id_terrain', initialData?.id_terrain);

//         if (error) throw error;

//         if (initialData?.id_tantsaha) {
//           await sendNotification(
//             supabase,
//             userId,
//             [{ id_utilisateur: initialData.id_tantsaha }],
//             data.validation_decision === 'valider' ? "Terrain validé" : "Terrain rejeté",
//             `Votre terrain ${initialData.nom_terrain} a été ${data.validation_decision === 'valider' ? 'validé' : 'rejeté'}`,
//             data.validation_decision === 'valider' ? "success" : "warning",
//             "terrain",
//             initialData.id_terrain
//           );
//         }

//         toast.success(`Terrain ${data.validation_decision === 'valider' ? 'validé' : 'rejeté'} avec succès`);

//         if (onSubmitSuccess) {
//           onSubmitSuccess({
//             ...initialData!,
//             photos_validation: terrainData.photos_validation,
//             statut: terrainData.statut,
//             date_validation: terrainData.date_validation,
//             rapport_validation: terrainData.rapport_validation,
//             validation_decision: terrainData.validation_decision,
//             surface_validee: terrainData.surface_validee
//           });
//         }
//       } else {
//         const uploadedPhotoUrls = await uploadPhotos(photos);

//         const existingPhotoUrls = photoUrls.filter(url => !url.startsWith('blob:'));
//         const allPhotoUrls = [...existingPhotoUrls, ...uploadedPhotoUrls];

//         terrainData.photos = allPhotoUrls.join(',');

//         console.log("Saving terrain data:", terrainData);

//         if (initialData?.id_terrain) {
//           terrainData.statut = initialData.statut;

//           const { data: updatedTerrain, error } = await supabase
//             .from('terrain')
//             .update({
//               id_region: terrainData.id_region,
//               id_district: terrainData.id_district,
//               id_commune: terrainData.id_commune,
//               nom_terrain: terrainData.nom_terrain,
//               surface_proposee: terrainData.surface_proposee,
//               acces_eau: terrainData.acces_eau,
//               acces_route: terrainData.acces_route,
//               id_tantsaha: terrainData.id_tantsaha,
//               photos: String(terrainData.photos),
//               geom: terrainData.geom,
//               statut: terrainData.statut
//             })
//             .eq('id_terrain', initialData.id_terrain)
//             .select('*')
//             .single();

//           if (error) throw error;

//           toast.success("Terrain modifié avec succès");

//           if (onSubmitSuccess) {
//             onSubmitSuccess({
//               ...initialData,
//               ...updatedTerrain
//             });
//           }
//         } else {
//           terrainData.statut = false;
//           const { id_terrain, ...dataSansId } = terrainData;

//           const { data: newTerrain, error } = await supabase
//             .from('terrain')
//             .insert([{
//               id_region: dataSansId.id_region,
//               id_district: dataSansId.id_district,
//               id_commune: dataSansId.id_commune,
//               nom_terrain: dataSansId.nom_terrain,
//               surface_proposee: dataSansId.surface_proposee,
//               acces_eau: dataSansId.acces_eau,
//               acces_route: dataSansId.acces_route,
//               id_tantsaha: dataSansId.id_tantsaha,
//               photos: typeof dataSansId.photos === 'string' ? dataSansId.photos : '',
//               geom: dataSansId.geom,
//               statut: dataSansId.statut
//             }])
//             .select('*')
//             .single();

//           if (error) throw error;

//           const { data: supervisors } = await supabase
//             .from('utilisateur')
//             .select('id_utilisateur')
//             .eq('id_role', 3);

//           if (supervisors && supervisors.length > 0 && userId) {
//             await sendNotification(
//               supabase,
//               userId,
//               supervisors,
//               "Nouveau terrain",
//               `Un nouveau terrain '${data.nom_terrain}' a été ajouté en attente de validation`,
//               "info",
//               "terrain",
//               newTerrain.id_terrain
//             );
//           }

//           toast.success("Terrain ajouté avec succès");

//           if (onSubmitSuccess) {
//             onSubmitSuccess(newTerrain);
//           }
//         }
//       }
//     } catch (error: any) {
//       toast.error("Erreur: " + error.message);
//       console.error("Error submitting terrain form:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-6">
//         {isValidationMode ? (
//           <ValidationForm
//             form={form}
//             photoValidationUrls={photoValidationUrls}
//             setPhotoValidationUrls={setPhotoValidationUrls}
//             validationPhotos={validationPhotos}
//             setValidationPhotos={setValidationPhotos}
//             terrain={initialData!}
//           />
//         ) : (
//           <TerrainFormFields
//             form={form}
//             userRole={userRole}
//             userId={userId}
//             agriculteurs={agriculteurs}
//             techniciens={techniciens}
//             photoUrls={photoUrls}
//             setPhotoUrls={setPhotoUrls}
//             photos={photos}
//             setPhotos={setPhotos}
//             polygonCoordinates={polygonCoordinates}
//             setPolygonCoordinates={setPolygonCoordinates}
//             overlapTerrains={overlapTerrains}
//           />
//         )}

//         <div className="flex justify-end space-x-4 pt-4">
//           <Button type="button" variant="outline" onClick={onCancel}>
//             Annuler
//           </Button>
//           <Button type="submit" disabled={isSubmitting || isUploading}>
//             {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             {isValidationMode ? "Valider le terrain" :
//               initialData?.id_terrain ? "Mettre à jour" : "Ajouter le terrain"}
//           </Button>
//         </div>
//       </form>
//     </Form>
//   );
// };

// export default TerrainForm;
