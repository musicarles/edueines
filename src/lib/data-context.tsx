import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DATA_MODE } from './env'
import { seedLocalData } from './seed'
import { getStore } from './store'
import type { Category, DataMode, Tool } from './types'

interface DataContextValue {
  tools: Tool[]
  categories: Category[]
  loading: boolean
  error: string | null
  mode: DataMode
  refresh: () => Promise<void>
  categoryById: (id: string) => Category | undefined
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<Tool[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      if (DATA_MODE === 'local') {
        await seedLocalData()
      }
      const store = await getStore()
      const [toolList, categoryList] = await Promise.all([
        store.getAll<Tool>('tools'),
        store.getAll<Category>('categories'),
      ])
      setTools([...toolList].sort((a, b) => a.name.localeCompare(b.name, 'ca')))
      setCategories([...categoryList].sort((a, b) => a.order - b.order))
      setError(null)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No s’ha pogut carregar el catàleg. Torna-ho a provar.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const categoryById = useCallback(
    (id: string) => categories.find((category) => category.id === id),
    [categories],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      tools,
      categories,
      loading,
      error,
      mode: DATA_MODE,
      refresh,
      categoryById,
    }),
    [tools, categories, loading, error, refresh, categoryById],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData s’ha d’utilitzar dins de DataProvider.')
  }
  return context
}
