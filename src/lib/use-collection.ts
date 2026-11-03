import { useCallback, useEffect, useRef, useState } from 'react'
import { getStore } from './store'
import type { CollectionName } from './types'

export interface CollectionState<T> {
  items: T[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setItems: (items: T[]) => void
}

/**
 * Petita capa de lectura per a les pantalles d'administració. Cada pantalla
 * demana les col·leccions que necessita i pot refrescar-les després d'una acció.
 */
export function useCollection<T>(
  collection: CollectionName,
  sort?: (a: T, b: T) => number,
): CollectionState<T> {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // El comparador pot ser una funció inline. El desem en una ref perquè
  // canviar-ne la identitat no dispari una recàrrega en bucle.
  const sortRef = useRef(sort)
  sortRef.current = sort

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const store = await getStore()
      const result = await store.getAll<T>(collection)
      const comparator = sortRef.current
      setItems(comparator ? [...result].sort(comparator) : result)
      setError(null)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No s’han pogut carregar les dades. Torna-ho a provar.',
      )
    } finally {
      setLoading(false)
    }
  }, [collection])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { items, loading, error, refresh, setItems }
}

export function useCollections(
  collections: CollectionName[],
): [Record<string, unknown[]>, boolean, string | null, () => Promise<void>] {
  const key = collections.join(',')
  const [data, setData] = useState<Record<string, unknown[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const store = await getStore()
      const entries = await Promise.all(
        key.split(',').map(async (collection) => {
          const items = await store.getAll(collection as CollectionName)
          return [collection, items] as const
        }),
      )
      setData(Object.fromEntries(entries))
      setError(null)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No s’han pogut carregar les dades. Torna-ho a provar.',
      )
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return [data, loading, error, refresh]
}

export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
