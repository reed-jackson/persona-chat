import { useCallback } from "react";

interface UseAutoResizeTextAreaOptions {
	maxHeight?: number;
	minHeight?: number;
}

export function useAutoResizeTextArea({ maxHeight = 200, minHeight = 56 }: UseAutoResizeTextAreaOptions = {}) {
	const handleTextAreaInput = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const textarea = e.target;

			// Reset height to auto to get the correct scrollHeight
			textarea.style.height = "auto";

			// Set new height based on content
			const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
			textarea.style.height = `${newHeight}px`;

			return textarea.value;
		},
		[maxHeight, minHeight]
	);

	const textAreaStyles = {
		minHeight: `${minHeight}px`,
		resize: "none" as const,
		overflow: "hidden",
		transition: "height 0.2s ease",
		flexGrow: 1,
	};

	return { handleTextAreaInput, textAreaStyles };
}
