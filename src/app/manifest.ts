import type { MetadataRoute } from "next";

import { BRAND_ICON_SIZE, BRAND_ICON_SRC, BRAND_ICON_TYPE } from "@/lib/brand";
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
        sizes: BRAND_ICON_SIZE,
        type: BRAND_ICON_TYPE,
        purpose: "any",
      },
    ],
  };
}
