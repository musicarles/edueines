import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlat a Edueines', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-cream px-4">
          <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
            <h1 className="font-display text-2xl font-bold text-ink">
              S’ha produït un error inesperat
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Torna a carregar la pàgina. Si el problema continua, comprova la configuració
              de dades o els registres del navegador.
            </p>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-left text-xs text-slate-500">
              {this.state.error.message}
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Torna a carregar
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
