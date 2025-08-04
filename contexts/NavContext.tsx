import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavbarContextType {
  isNavbarVisible: boolean;
  showNavbar: () => void;
  hideNavbar: () => void;
  toggleNavbar: () => void;
  setNavbarVisibility: (visible: boolean) => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

interface NavbarProviderProps {
  children: ReactNode;
  defaultVisible?: boolean;
}

export const NavbarProvider: React.FC<NavbarProviderProps> = ({ 
  children, 
  defaultVisible = true 
}) => {
  const [isNavbarVisible, setIsNavbarVisible] = useState<boolean>(defaultVisible);

  const showNavbar = () => setIsNavbarVisible(true);
  
  const hideNavbar = () => setIsNavbarVisible(false);
  
  const toggleNavbar = () => setIsNavbarVisible(prev => !prev);
  
  const setNavbarVisibility = (visible: boolean) => setIsNavbarVisible(visible);

  const value: NavbarContextType = {
    isNavbarVisible,
    showNavbar,
    hideNavbar,
    toggleNavbar,
    setNavbarVisibility,
  };

  return (
    <NavbarContext.Provider value={value}>
      {children}
    </NavbarContext.Provider>
  );
};

// Hook personnalisé pour utiliser le context
export const useNavbar = (): NavbarContextType => {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
};

// Hook avec effet automatique pour cacher/montrer la navbar
export const useNavbarEffect = (shouldShow: boolean) => {
  const { setNavbarVisibility } = useNavbar();
  
  React.useEffect(() => {
    setNavbarVisibility(shouldShow);
  }, [shouldShow, setNavbarVisibility]);
};

// Hook pour les pages qui veulent cacher la navbar au montage
export const useHideNavbar = () => {
  const { hideNavbar, showNavbar } = useNavbar();
  
  React.useEffect(() => {
    hideNavbar();
    
    // Optionnel: remonter la navbar quand le composant se démonte
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);
};

// Hook pour les pages qui veulent montrer la navbar au montage
export const useShowNavbar = () => {
  const { showNavbar } = useNavbar();
  
  React.useEffect(() => {
    showNavbar();
  }, [showNavbar]);
};