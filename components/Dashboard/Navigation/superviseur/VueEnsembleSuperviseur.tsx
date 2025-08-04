import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import React from 'react';

const { width } = Dimensions.get('window');

const VueEnsembleSuperviseur = ({
    id
}: { id: string }) => {
  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {/* Cartes statistiques en haut */}
      <View className="flex-row flex-wrap justify-between mb-6">
        {/* Projets Total */}
        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4 w-full">
          <Text className="text-gray-500 text-sm mb-1">Projets Total</Text>
          <Text className="text-2xl font-bold text-gray-800">15</Text>
        </View>

        {/* Taux de Réussite */}
        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4  w-full">
          <Text className="text-gray-500 text-sm mb-1">Taux de Réussite</Text>
          <Text className="text-2xl font-bold text-blue-600">100.0%</Text>
        </View>

        {/* Projets en Retard */}
        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4  w-full">
          <Text className="text-gray-500 text-sm mb-1">Projets en Retard</Text>
          <Text className="text-2xl font-bold text-gray-800">0</Text>
        </View>

        {/* Incidents Résolus */}
        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4 w-full">
          <Text className="text-gray-500 text-sm mb-1">Incidents Résolus</Text>
          <Text className="text-2xl font-bold text-gray-800">0</Text>
        </View>
      </View>

      {/* Section Vue d'ensemble et Projets */}
      <View className="flex-col justify-between gap-2">
        {/* Vue d'ensemble */}
        <View className="bg-white  border border-gray-200 rounded-lg p-4 w-full">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Vue d&apos;ensemble</Text>
          
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600 text-sm">Projets</Text>
              <Text className="text-gray-800 font-medium">100.0%</Text>
            </View>
            <View className="w-full h-2 bg-gray-200 rounded-full">
              <View className="w-full h-2 bg-green-500 rounded-full"></View>
            </View>
          </View>

          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600 text-sm">Équipe A</Text>
              <Text className="text-gray-800 font-medium">2%</Text>
            </View>
            <View className="w-full h-2 bg-gray-200 rounded-full">
              <View className="w-1 h-2 bg-gray-800 rounded-full"></View>
            </View>
          </View>

          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600 text-sm">Équipe B</Text>
              <Text className="text-gray-800 font-medium">4%</Text>
            </View>
            <View className="w-full h-2 bg-gray-200 rounded-full">
              <View className="w-2 h-2 bg-gray-800 rounded-full"></View>
            </View>
          </View>

          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600 text-sm">Équipe C</Text>
              <Text className="text-gray-800 font-medium">0</Text>
            </View>
            <View className="w-full h-2 bg-gray-200 rounded-full">
              <View className="w-0 h-2 bg-gray-800 rounded-full"></View>
            </View>
          </View>
        </View>

        {/* Projets */}
        <View className="bg-white  border border-gray-200 rounded-lg p-4 w-full">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Projets</Text>
          
          <View className="flex flex-col mb-3">
            <View className="flex-row justify-between items-center mb-1 w-full">
              <Text className="text-gray-600 text-sm">Terminés</Text>
              <Text className="text-gray-800 font-medium">Complétés</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 text-sm">En cours</Text>
              <Text className="text-gray-800 font-medium">Actifs</Text>
            </View>
          </View>

          <View className="mb-3">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-gray-600 text-sm">Planifiés</Text>
              <Text className="text-gray-800 font-medium">À venir</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 text-sm">Retardés</Text>
              <Text className="text-gray-800 font-medium">Bloqués</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Section graphiques */}
      <View className="flex-col justify-between gap-2 mt-2">
        {/* Évolution Mensuelle */}
        <View className="bg-white  border border-gray-200 rounded-lg p-4 w-full">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Évolution Mensuelle</Text>
          
          {/* Graphique en barres simplifié */}
          <View className="flex-row items-end justify-between h-32">
            <View className="flex-col items-center">
              <View className="w-6 bg-green-500 rounded-t" style={{ height: 20 }}></View>
              <Text className="text-xs text-gray-500 mt-1">J</Text>
            </View>
            <View className="flex-col items-center">
              <View className="w-6 bg-green-500 rounded-t" style={{ height: 35 }}></View>
              <Text className="text-xs text-gray-500 mt-1">F</Text>
            </View>
            <View className="flex-col items-center">
              <View className="w-6 bg-green-500 rounded-t" style={{ height: 50 }}></View>
              <Text className="text-xs text-gray-500 mt-1">M</Text>
            </View>
            <View className="flex-col items-center">
              <View className="w-6 bg-green-500 rounded-t" style={{ height: 70 }}></View>
              <Text className="text-xs text-gray-500 mt-1">A</Text>
            </View>
            <View className="flex-col items-center">
              <View className="w-6 bg-green-500 rounded-t" style={{ height: 90 }}></View>
              <Text className="text-xs text-gray-500 mt-1">M</Text>
            </View>
            <View className="flex-col items-center">
              <View className="w-6 bg-green-500 rounded-t" style={{ height: 110 }}></View>
              <Text className="text-xs text-gray-500 mt-1">J</Text>
            </View>
          </View>
        </View>

        {/* Répartition des Projets */}
        <View className="bg-white  border border-gray-200 rounded-lg p-4 w-full mb-2">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Répartition des Projets</Text>
          
          {/* Graphique circulaire simplifié */}
          <View className="items-center justify-center h-32">
            <View className="w-24 h-24 rounded-full bg-green-500 items-center justify-center">
              <Text className="text-white font-bold text-lg">100%</Text>
            </View>
            <View className="flex-row items-center mt-4">
              <View className="w-3 h-3 bg-green-500 rounded mr-2"></View>
              <Text className="text-gray-600 text-sm">Terminé(s)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Performance des Techniciens */}
      <View className="bg-white rounded-lg p-4 mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">Performance des Techniciens</Text>
        
        {/* Marie Alice */}
        <View className="flex-col items-center justify-between py-3 border-b border-gray-100 ww-full">
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 bg-gray-300 rounded-full mr-3"></View>
            <Text className="text-gray-800 font-medium">Marie Alice</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-16 h-2 bg-gray-200 rounded-full mr-2">
              <View className="w-full h-2 bg-gray-800 rounded-full"></View>
            </View>
            <TouchableOpacity className="bg-gray-800 px-3 py-1 rounded">
              <Text className="text-white text-xs">Voir détails</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ananda Soatra Ratoany */}
        <View className="flex-row items-center justify-between py-3">
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 bg-gray-300 rounded-full mr-3"></View>
            <Text className="text-gray-800 font-medium">Ananda Soatra Ratoany</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-16 h-2 bg-gray-200 rounded-full mr-2">
              <View className="w-full h-2 bg-gray-800 rounded-full"></View>
            </View>
            <TouchableOpacity className="bg-gray-800 px-3 py-1 rounded">
              <Text className="text-white text-xs">Voir détails</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Section Actions */}
      <View className="flex-row justify-between mb-6">
        {/* Améliorer Performance */}
        <TouchableOpacity className="bg-white rounded-lg p-4 items-center" style={{ width: (width - 32) / 3 - 8 }}>
          <Text className="text-gray-800 font-medium text-center mb-2">Améliorer Performance</Text>
          <View className="w-full h-2 bg-gray-200 rounded-full mb-2">
            <View className="w-4/5 h-2 bg-green-500 rounded-full"></View>
          </View>
          <Text className="text-green-600 font-bold">95%</Text>
        </TouchableOpacity>

        {/* Audit Sécurité */}
        <TouchableOpacity className="bg-white rounded-lg p-4 items-center" style={{ width: (width - 32) / 3 - 8 }}>
          <Text className="text-gray-800 font-medium text-center mb-2">Audit Sécurité</Text>
          <View className="w-full h-2 bg-gray-200 rounded-full mb-2">
            <View className="w-4/5 h-2 bg-green-500 rounded-full"></View>
          </View>
          <Text className="text-green-600 font-bold">88%</Text>
        </TouchableOpacity>

        {/* Analyse Préventif */}
        <TouchableOpacity className="bg-white rounded-lg p-4 items-center" style={{ width: (width - 32) / 3 - 8 }}>
          <Text className="text-gray-800 font-medium text-center mb-2">Analyse Préventif</Text>
          <View className="w-full h-2 bg-gray-200 rounded-full mb-2">
            <View className="w-4/5 h-2 bg-green-500 rounded-full"></View>
          </View>
          <Text className="text-green-600 font-bold">92%</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default VueEnsembleSuperviseur;