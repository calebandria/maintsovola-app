import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useCallback,
  } from "react";
  
  // 1. Type des données du contexte
  type LastPageContextType = {
    lastPage: string;
    setLastPage: (page: string) => void;
  };
  
  // 2. Contexte
  const LastPageContext = createContext<LastPageContextType | undefined>(undefined);
  
  // 3. Provider
  export const LastPageProvider = ({ children }: { children: ReactNode }) => {
    const [lastPage, setLastPageState] = useState<string>("");
  
    // Optionnel : useCallback pour stabilité des références
    const setLastPage = useCallback((page: string) => {
      setLastPageState(page);
    }, []);
  
    return (
      <LastPageContext.Provider value={{ lastPage, setLastPage }}>
        {children}
      </LastPageContext.Provider>
    );
  };
  
  // 4. Hook personnalisé pour utiliser le contexte plus facilement
  export const useLastPage = () => {
    const context = useContext(LastPageContext);
    if (!context) {
      throw new Error("useLastPage must be used within a LastPageProvider");
    }
    return context;
  };
  