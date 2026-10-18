import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Metatransformer — A workshop for invention",
  description: "An open, local-first workshop for physical invention. Design mechanisms, collect real parts, and build with your own coding agent.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{ margin: 0 }}>{children}</body></html>;
}
