import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, type ButtonVariant } from './ui/Button'

export function ShareButton({
  title,
  text,
  url,
  variant = 'outline',
  className,
}: {
  title: string
  text?: string
  url: string
  variant?: ButtonVariant
  className?: string
}) {
  async function handleShare() {
    const data = { title, text, url }
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(data)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enllaç copiat al porta-retalls.')
    } catch {
      toast.error('No s’ha pogut copiar l’enllaç. Copia’l manualment de la barra d’adreces.')
    }
  }

  return (
    <Button type="button" variant={variant} onClick={handleShare} className={className}>
      <Share2 className="size-4" aria-hidden="true" />
      Comparteix
    </Button>
  )
}
