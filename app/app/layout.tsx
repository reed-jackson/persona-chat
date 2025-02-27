import "@radix-ui/themes/styles.css";
import { Flex } from "@radix-ui/themes";

export default function AppLayout({ children, thread }: { children: React.ReactNode; thread: React.ReactNode }) {
	return (
		<Flex width="100%" className="overflow-hidden" position="fixed" top="0" left="0" right="0" bottom="0">
			{children}
			{thread}
		</Flex>
	);
}
