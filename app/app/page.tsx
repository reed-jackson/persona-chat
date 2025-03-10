"use client";

import { Suspense } from "react";
import AppContent from "./AppContent";

export default function AppPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AppContent />
		</Suspense>
	);
}
