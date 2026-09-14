import type { MetadataRoute } from "next";

import { BRAND_ICON_SRC } from "@/lib/brand";
import { PRODUCT_NAME } from "@/lib/product";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    display: "standalone",
    start_url: "/",
    icons: [
      {
        src: BRAND_ICON_SRC,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
