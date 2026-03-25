import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 3;

export const [SearchHistoryProvider, useSearchHistory] = createContextHook(() => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load search history from AsyncStorage on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored) as SearchHistoryItem[];
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSearchHistory = useCallback(async (history: SearchHistoryItem[]) => {
    if (!Array.isArray(history)) return;
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, []);

  const addSearchQuery = useCallback((query: string) => {
    if (!query || !query.trim()) return;
    if (query.length > 200) return;
    const sanitizedQuery = query.trim();

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: sanitizedQuery,
      timestamp: Date.now(),
    };

    setSearchHistory(prevHistory => {
      // Remove duplicate if exists
      const filteredHistory = prevHistory.filter(item => 
        item.query.toLowerCase() !== sanitizedQuery.toLowerCase()
      );
      
      // Add new item at the beginning and limit to MAX_HISTORY_ITEMS
      const newHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to AsyncStorage
      saveSearchHistory(newHistory);
      
      return newHistory;
    });
  }, [saveSearchHistory]);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  const removeSearchItem = useCallback((id: string) => {
    if (!id || !id.trim()) return;
    const sanitizedId = id.trim();
    
    setSearchHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item.id !== sanitizedId);
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, [saveSearchHistory]);

  return useMemo(() => ({
    searchHistory,
    isLoading,
    addSearchQuery,
    clearSearchHistory,
    removeSearchItem,
  }), [searchHistory, isLoading, addSearchQuery, clearSearchHistory, removeSearchItem]);
});