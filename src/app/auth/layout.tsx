import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const productName = process.env.NEXT_PUBLIC_PRODUCTNAME || 'VTT Labs';

    return (
        <div className="flex min-h-screen">
            {/* Left Panel - Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative">
                <Link
                    href="/"
                    className="absolute left-6 top-6 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back
                </Link>

                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-lg">V</span>
                        </div>
                    </div>
                    <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
                        {productName}
                    </h2>
                    <p className="mt-1 text-center text-sm text-muted-foreground">
                        Your application laboratory
                    </p>
                </div>

                <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
                    {children}
                </div>
            </div>

            {/* Right Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 relative overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
                
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), 
                                     linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                    backgroundSize: '64px 64px'
                }} />

                <div className="w-full flex items-center justify-center p-12 relative z-10">
                    <div className="max-w-md text-center">
                        {/* Large Logo */}
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                                <span className="text-primary-foreground font-bold text-3xl">V</span>
                            </div>
                        </div>

                        <h3 className="text-white text-3xl font-bold mb-4">
                            VTT Labs
                        </h3>
                        
                        <p className="text-zinc-400 text-base leading-relaxed mb-8">
                            A modular application laboratory to manage your goals, 
                            finances, tasks, and much more.
                        </p>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap justify-center gap-2">
                            {['OKR', 'Finance', 'Tasks', 'AI Agents', 'Notes'].map((feature) => (
                                <span 
                                    key={feature}
                                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-zinc-300 border border-white/10"
                                >
                                    {feature}
                                </span>
                            ))}
                        </div>

                        {/* Bottom tagline */}
                        <div className="mt-12 pt-8 border-t border-white/10">
                            <p className="text-zinc-500 text-sm">
                                Powered by the red signature
                            </p>
                            <div className="mt-2 flex justify-center gap-1">
                                <div className="w-8 h-1 rounded-full bg-primary" />
                                <div className="w-2 h-1 rounded-full bg-primary/50" />
                                <div className="w-1 h-1 rounded-full bg-primary/25" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}