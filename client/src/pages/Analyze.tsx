/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SearchIcon, GlobeIcon, FileSearchIcon, BrainIcon, CheckCircleIcon, AlertCircle, Loader2, ArrowRightIcon } from "lucide-react";

const STEPS = [
    { icon: <GlobeIcon size={22} />, label: "Connecting to browser", desc: "Creating cloud browser session..." },
    { icon: <FileSearchIcon size={22} />, label: "Scanning website", desc: "Extracting meta tags, links, images..." },
    { icon: <BrainIcon size={22} />, label: "AI Analysis", desc: "Gemini is analyzing your SEO data..." },
    { icon: <CheckCircleIcon size={22} />, label: "Report Ready", desc: "Your SEO report is complete!" },
];

export default function Analyze() {
    const [url, setUrl] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState("");
    const [searchParams] = useSearchParams();
    const pollRef = useRef<any>(null);

    const navigate = useNavigate();

    const handleAnalyze = async (submitUrl?: string) => {
        const targetUrl = submitUrl || url;
        if (!targetUrl.trim()) return;

        setError("");
        setAnalyzing(true);
        setCurrentStep(0);

        setTimeout(() => setCurrentStep(1), 1000);
        setTimeout(() => setCurrentStep(2), 3000);
        setTimeout(() => setCurrentStep(3), 6000);
        setTimeout(() => {
            setAnalyzing(false);
            navigate(`/report/id123`);
        }, 8000);
    };

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        handleAnalyze();
    };

    useEffect(() => {
        const prefillUrl = searchParams.get("url");
        if (prefillUrl) {
            (() => setUrl(prefillUrl))();
            // Auto-start if URL is provided
            setTimeout(() => handleAnalyze(prefillUrl), 500);
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    return (
        <div className="min-h-screen pt-16 md:pt-24 bg-background">
            <div className="max-w-3xl mx-auto px-4 py-12">
                {!analyzing ? (
                    <div>
                        <div className="text-center mb-10 mt-24">
                            <h1 className="text-3xl sm:text-4xl font-medium text-foreground mb-3">
                                Analyze <span className="gradient-text">Any Website</span>
                            </h1>
                            <p className="text-muted-foreground">Enter a URL to get a comprehensive AI-powered SEO audit report.</p>
                        </div>

                        {error && (
                            <div className="mb-6 px-4 py-3 rounded-xl severity-critical text-sm flex items-center gap-2 max-w-xl mx-auto">
                                <AlertCircle size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                            <div className="border border-primary/20 rounded-full p-1.5 px-2 flex items-center gap-2">
                                <div className="flex items-center gap-3 flex-1 px-3">
                                    <SearchIcon size={20} className="text-muted-foreground shrink-0" />
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="Enter website URL (e.g., example.com)"
                                        className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none text-base py-3"
                                        id="analyze-url-input"
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="bg-primary px-6 py-3 rounded-full flex items-center gap-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity shrink-0" id="analyze-submit-btn" style={{ color: "var(--background)" }}>
                                    Analyze <ArrowRightIcon className="text-background size-4 shrink-0" />
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            Examples:{" "}
                            {["github.com", "stripe.com", "vercel.com"].map((ex, i) => (
                                <span key={ex}>
                                    <button
                                        onClick={() => {
                                            setUrl(ex);
                                        }}
                                        className="text-primary hover:underline"
                                    >
                                        {ex}
                                    </button>
                                    {i < 2 ? ", " : ""}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Analyzing State */}
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-medium text-foreground">Analyzing Your Website</h2>
                            <div className="flex justify-center items-center gap-2 mt-2">
                                <Loader2 size={16} className="text-primary/60 mt-0.5 animate-spin" />
                                <p className="text-muted-foreground sm:text-lg">{url}</p>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="max-w-md mx-auto space-y-4">
                            {STEPS.map((step, i) => {
                                const isComplete = i < currentStep;
                                const isCurrent = i === currentStep;
                                const isPending = i > currentStep;

                                return (
                                    <div key={step.label} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isCurrent ? "glass-strong border-primary/30" : isComplete ? "glass opacity-60" : "glass opacity-30"}`}>
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isComplete ? "bg-success/15 text-success" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                                            style={isCurrent ? { color: "var(--background)" } : {}}
                                        >
                                            {isComplete ? <CheckCircleIcon size={20} /> : step.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${isPending ? "text-muted-foreground" : "text-foreground"}`}>{step.label}</p>
                                            <p className="text-xs text-muted-foreground">{step.desc}</p>
                                        </div>
                                        {isCurrent && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />}
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-center text-xs text-muted-foreground mt-8">This may take 15-30 seconds depending on the website.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
