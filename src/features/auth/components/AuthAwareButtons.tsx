"use client";
import { useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthAwareButtons({ variant = 'primary' }: { variant?: 'primary' | 'nav' }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = await createSPASassClient();
                const { data: { user } } = await supabase.getSupabaseClient().auth.getUser();
                setIsAuthenticated(!!user);
            } catch (error) {
                console.error('Error checking auth status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return null;
    }

    // Navigation buttons for the header
    if (variant === 'nav') {
        return isAuthenticated ? (
            <Button asChild>
                <Link href="/app">
                    Go to Dashboard
                </Link>
            </Button>
        ) : (
            <>
                <Button variant="ghost" asChild>
                    <Link href="/auth/login">
                        Login
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/auth/register">
                        Get Started
                    </Link>
                </Button>
            </>
        );
    }

    // Primary buttons for the hero section
    return isAuthenticated ? (
        <Button size="lg" asChild className="px-6 py-3 text-base">
            <Link href="/app">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
        </Button>
    ) : (
        <>
            <Button size="lg" asChild className="px-6 py-3 text-base">
                <Link href="/auth/register">
                    Start Building Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="px-6 py-3 text-base">
                <Link href="#features">
                    Learn More
                    <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
            </Button>
        </>
    );
}