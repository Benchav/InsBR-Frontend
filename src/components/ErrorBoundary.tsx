import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="bg-destructive/10 p-4 rounded-full">
                                <AlertTriangle className="h-12 w-12 text-destructive" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Algo salió mal
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Ha ocurrido un error inesperado al intentar procesar tu solicitud.
                            </p>
                            {this.state.error && (
                                <div className="bg-muted p-4 rounded-md text-xs font-mono text-left overflow-auto max-h-40 my-4">
                                    {this.state.error.message}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full"
                            >
                                Recargar página
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    window.location.href = '/';
                                }}
                                className="w-full"
                            >
                                Ir al inicio
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
