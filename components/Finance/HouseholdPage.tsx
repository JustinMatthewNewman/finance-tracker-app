"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MemberDetailCard from "./MemberDetailCard";
import AmbientBackground from "@/components/AmbientBackground";

function HouseholdPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    // Opens on the category breakdown rather than the flat transaction list —
    // "where did the money go" is what this page is usually opened to answer.
    // The header's ToggleButtonGroup switches back to the list alone.
    const [showBreakdown, setShowBreakdown] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <span className="text-sm text-gray-400">Loading...</span>
            </div>
        );
    }

    if (!user) return null; // redirect in flight

    return (
        <div className="relative flex h-full flex-col gap-4 overflow-hidden p-4">
            <AmbientBackground intensity={0.85} />

            <div className="relative z-10 flex h-full min-h-0 flex-col gap-4 overflow-hidden">
                <MemberDetailCard
                    showBreakdown={showBreakdown}
                    onToggleBreakdown={setShowBreakdown}
                />
            </div>
        </div>
    );
}

export default HouseholdPage;
