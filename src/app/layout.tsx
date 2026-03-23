import "~/styles/globals.css";

import { type Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import Navigation from "~/components/Navigation";
import { TagsProvider } from "~/hooks/useTagSelector";
import getAllTags from "~/server/actions/getAllTags";
import { CreatePostProvider } from "~/components/CreatePost";

export const metadata: Metadata = {};

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <TagsProvider value={getAllTags()}>
          <CreatePostProvider>
            <Navigation />
            <main className="flex-1 bg-gray-100">{children}</main>
          </CreatePostProvider>
        </TagsProvider>
      </body>
    </html>
  );
}
