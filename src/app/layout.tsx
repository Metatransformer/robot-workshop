import type { Metadata } from "next";

const isHosted = process.env.VERCEL === "1";

export const metadata: Metadata = {
  title: "AI Robot Workshop — Local-first physical invention and learning",
  description: "Nick Bryant's open-source portfolio prototype for learning, planning, and building physical inventions with local project files and coding agents.",
  authors: [{ name: "Nick Bryant", url: "https://metatransformer.com" }],
  creator: "Nick Bryant",
  robots: { index: isHosted, follow: isHosted },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{ margin: 0 }}>{children}</body></html>;
}
