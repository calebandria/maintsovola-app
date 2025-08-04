"use client"

import { useRouter, useSegments } from 'expo-router';
import { LucideArrowLeft, LucideBackpack } from 'lucide-react-native';
import React, { createContext, useContext, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavbar } from '~/contexts/NavContext';
import { useLastPage } from '~/contexts/LastPageContext';

export default function ReturnBack() {
  const router = useRouter();
  const { isNavbarVisible, hideNavbar } = useNavbar();
  const { lastPage } = useLastPage();
    const segments = useSegments();
    
  React.useEffect(() => {
    if (isNavbarVisible) {
      hideNavbar();
    }
  }, [isNavbarVisible, hideNavbar]);

  
  return (
    <TouchableOpacity
        
        onPress={() => {
          if ( lastPage === '/messages' || lastPage === '/terrain'
            || lastPage === '/projet'   || lastPage === '/feed') {
              router.push('/feed');
          } else {
            router.back()
          }
        }}
    className="flex-row items-center justify-center p-2"
    >
    <LucideArrowLeft size={24} color="#000" />
    </TouchableOpacity>

  );
}