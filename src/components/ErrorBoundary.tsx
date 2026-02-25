"use client";
import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("[ErrorBoundary]", error, info);
    // TODO: enviar a servicio de logging (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
            <AlertTriangle className="w-12 h-12 text-hago-error mb-4" />
            <h2 className="text-xl font-bold text-hago-gray-900 mb-2">Algo salió mal</h2>
            <p className="text-hago-gray-600 mb-4">
              Ocurrió un error inesperado al cargar esta sección.
            </p>
            <Button
              onClick={() => this.setState({ hasError: false })}
              className="bg-hago-primary-800 hover:bg-hago-primary-900 text-white"
            >
              Intentar de nuevo
            </Button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
