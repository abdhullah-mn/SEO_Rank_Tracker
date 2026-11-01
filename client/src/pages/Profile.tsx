import { useEffect, useState, type FormEvent } from "react";
import { BadgeCheck, CalendarDays, Loader2, Mail, Save, UserRound } from "lucide-react";
import { useApp } from "../context/AppContext";

const inputClassName = "w-full rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50";

export default function Profile() {
    const { user, updateProfile } = useApp();
    const [name, setName] = useState(user?.name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);

    useEffect(() => {
        setName(user?.name ?? "");
        setEmail(user?.email ?? "");
    }, [user?.name, user?.email]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");

        const result = await updateProfile(name.trim(), email.trim());
        setMessage(result.message);
        setError(!result.success);
        setSaving(false);
    };

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
        : "Member";

    return (
        <main className="min-h-screen bg-background pb-12 pt-24 text-foreground">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <header className="mb-8">
                    <p className="mb-2 text-sm font-medium text-accent">Account</p>
                    <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Manage your personal information and account details.</p>
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
                    <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                        <div className="mb-7 flex items-center gap-4 border-b border-border pb-6">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xl font-semibold text-accent" aria-hidden="true">
                                {user?.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate text-lg font-semibold">{user?.name}</h2>
                                <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium">Full name</span>
                                <span className="relative block">
                                    <UserRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                    <input
                                        className={`${inputClassName} pl-11`}
                                        type="text"
                                        name="name"
                                        autoComplete="name"
                                        maxLength={100}
                                        required
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                    />
                                </span>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-medium">Email address</span>
                                <span className="relative block">
                                    <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                    <input
                                        className={`${inputClassName} pl-11`}
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                    />
                                </span>
                            </label>

                            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                                <button
                                    type="submit"
                                    disabled={saving || !name.trim() || !email.trim()}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{ color: "var(--background)" }}
                                >
                                    {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                                    {saving ? "Saving..." : "Save changes"}
                                </button>
                                {message && (
                                    <p className={`text-sm ${error ? "text-danger" : "text-success"}`} role={error ? "alert" : "status"}>
                                        {message}
                                    </p>
                                )}
                            </div>
                        </form>
                    </section>

                    <aside className="space-y-6">
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <h2 className="mb-5 text-base font-semibold">Account details</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                        <BadgeCheck size={19} aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Current plan</p>
                                        <p className="text-sm font-medium capitalize">{user?.plan}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                        <CalendarDays size={19} aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Member since</p>
                                        <p className="text-sm font-medium">{memberSince}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}
