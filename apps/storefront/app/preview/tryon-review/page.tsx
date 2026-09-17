import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { TryonReviewGrid, type TryonImage } from "./TryonReviewGrid";

export const metadata: Metadata = {
  title: "Try-on photo review",
  robots: { index: false, follow: false },
};

const MODEL_DIRS = ["worn-victor", "worn-victor-male"] as const;

function listImages(): TryonImage[] {
  const publicDir = path.join(process.cwd(), "public", "tryon");
  const images: TryonImage[] = [];
  for (const dir of MODEL_DIRS) {
    const dirPath = path.join(publicDir, dir);
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".jpg"));
    for (const file of files) {
      const match = file.match(/^(.*)-(front|left|right)\.jpg$/);
      if (!match) continue;
      const [, handle, pose] = match;
      images.push({
        id: `${dir}/${file}`,
        model: dir,
        handle,
        pose,
        url: `/tryon/${dir}/${file}`,
      });
    }
  }
  images.sort((a, b) => a.handle.localeCompare(b.handle) || a.model.localeCompare(b.model) || a.pose.localeCompare(b.pose));
  return images;
}

export default function TryonReviewPage() {
  const images = listImages();
  return <TryonReviewGrid images={images} />;
}
