import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { productPhotos, productPhotoStyle } from "@/lib/product-photos"
import styles from "./preview.module.css"

export const metadata: Metadata = {
  title: "Bộ ảnh eyewear",
  robots: { index: false, follow: false },
}

const brands = [
  ["cartier", "Cartier"], ["chrome-hearts", "Chrome Hearts"], ["fendi", "Fendi"],
  ["gucci", "Gucci"], ["jacques-marie-mage", "Jacques Marie Mage"],
  ["miu-miu", "Miu Miu"], ["prada", "Prada"], ["tom-ford", "Tom Ford"],
]

export default function EyewearPreview() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p>EYEWEAR COLLECTION</p>
        <h1>Bộ ảnh sản phẩm</h1>
        <p>120 mẫu từ 8 thương hiệu. Nền trắng, khung vuông và kích thước hiển thị đồng đều. Đã áp dụng vào danh mục sản phẩm.</p>
        <p>Giữ góc chụp sẵn có của từng mẫu.</p>
        <a href="#collection">Xem toàn bộ</a>
      </header>
      <div id="collection">
        {brands.map(([slug, brand]) => (
          <section key={slug} className={styles.collection}>
            <h2>{brand}</h2>
            <div className={styles.grid}>
              {Object.entries(productPhotos).filter(([handle]) => handle.startsWith(`sun-${slug}-`)).map(([handle, photo]) => (
                <figure key={handle}>
                  <Link href={`/products/${handle}`}>
                    <div className={styles.photo}>
                      <Image src={photo.src} style={productPhotoStyle(photo.src)} alt={handle.replaceAll("-", " ")} fill sizes="(max-width: 700px) 45vw, 24vw" />
                    </div>
                    <figcaption>{handle.slice(slug.length + 5).replaceAll("-", " ").toUpperCase()}</figcaption>
                  </Link>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
