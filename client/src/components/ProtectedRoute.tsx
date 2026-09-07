import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function ProtectedRoute() {
    const { user, loading } = useApp();
    const location = useLocation();

    if (loading) {
        return (
            <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="size-10 rounded-full border-4 border-border border-t-accent animate-spin" aria-hidden="true" />
                    <p className="text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
                        Checking your session...
                    </p>
                </div>
            </main>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
