import { useState } from 'react';
import { Button, Image, View, StyleSheet, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LucideCamera } from 'lucide-react-native';

export default function MyImagePicker() {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View className="flex-1 items-center justify-center">
      <TouchableOpacity 

        className="bg-blue-500 p-4 rounded-lg"
        onPress={pickImage}
      >
        <LucideCamera size={24} color="white" />
      </TouchableOpacity>
      {image && 
        <Image 
          source={{ uri: image }} 
          style={{ width: 20, height: 20}} 
          className="rounded-lg mt-4"
          resizeMode="cover"  
        />
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
});
