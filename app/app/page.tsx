"use client";

import AppContent from "@/components/AppContent";
import { Suspense } from "react";

export default function AppPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AppContent />
		</Suspense>
	);
}
