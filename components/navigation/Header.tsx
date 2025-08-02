import type React from "react"
import { View, Text, Image, TouchableOpacity } from "react-native"
import SearchBar from "../chat/SearchBar"
import { useCallback, useState } from "react"

interface HeaderProps {
  onSearchPress?: () => void
  onMenuPress?: () => void
}

const Header: React.FC<HeaderProps> = ({ onSearchPress, onMenuPress }) => {
  const [search, setSearch] = useState('');
  const handleSearch = useCallback((text: string) => {
      setSearch(text);
  }, []);
     
  return (
    <View className="w-full max-h-fit border-b border-gray-200 shadow-sm bg-green-100">
      <View className="flex-row items-center justify-between px-4 py-3">
        {/* Logo */}
        <View className="flex-row items-center">
          <Image
            source={require("../../assets/maintsovola_logo_pm.png")}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
          <Text className="text-2xl font-bold text-green-500 ml-2">Maintso</Text>
          <Text className="text-2xl ml-2 font-bold text-gray-800">Vola</Text>
        </View>
      </View>
    </View>
  )
}

export default Header;