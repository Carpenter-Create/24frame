import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

import { ThemeSync } from "@/components/theme-toggle";
import { BRAND_ICON_SIZE, BRAND_ICON_SRC, BRAND_ICON_TYPE } from "@/lib/brand";
import { AGGREGATION_WORKSPACE, PRODUCT_NAME } from "@/lib/product";
import { NO_FLASH_THEME_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: `${PRODUCT_NAME} ${AGGREGATION_WORKSPACE}.`,
  icons: {
    icon: [{ url: BRAND_ICON_SRC, type: BRAND_ICON_TYPE, sizes: BRAND_ICON_SIZE }],
    apple: [{ url: BRAND_ICON_SRC, type: BRAND_ICON_TYPE, sizes: BRAND_ICON_SIZE }],
  },
};

// Applied before paint to prevent a flash. Light is the guaranteed default;
// dark and Auto are explicit gc-theme choices. Auto is never implied.

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
