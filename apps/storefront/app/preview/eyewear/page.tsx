import Image from "next/image"
import type { Metadata } from "next"
import styles from "./preview.module.css"

export const metadata: Metadata = {
  title: "Eyewear photo preview",
  robots: { index: false, follow: false },
}

const models = ["ashcroft", "dealan", "dealan-53", "enzo", "fellini", "torino", "molino", "molino-55"]

const previewScale: Record<string, number> = {
  ashcroft: 0.9254, dealan: 0.8381, "dealan-53": 0.9506, enzo: 0.9245,
  fellini: 0.8694, torino: 0.9116, molino: 0.8702, "molino-55": 0.8749,
}

export default function EyewearPreview() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p>JACQUES MARIE MAGE</p>
        <h1>Ảnh sản phẩm: trước và sau</h1>
        <p>8 bản thử nền trắng, khung vuông, kính chiếm khoảng 78% chiều ngang. Ảnh danh mục hiện tại chưa thay đổi.</p>
        <p>Bản xử lý bằng AI để duyệt cách trình bày. Cần đối chiếu chi tiết gọng và tròng trước khi dùng bán hàng.</p>
        <a href="#collection">Xem cả bộ sau xử lý</a>
      </header>
      <div className={styles.comparisons}>
        {models.map((model) => (
          <article key={model} className={styles.comparison}>
            <h2>{model.replaceAll("-", " ").toUpperCase()}</h2>
            <div className={styles.pair}>
              <figure>
                <figcaption>Ảnh gốc</figcaption>
                <div className={styles.photo}>
                  <Image src={`/images/sunglasses/sun-jacques-marie-mage-${model}.jpg`} alt={`${model} ảnh gốc`} fill sizes="(max-width: 700px) 45vw, 24vw" />
                </div>
              </figure>
              <figure>
                <figcaption>Bản thử nền trắng</figcaption>
                <div className={styles.photo}>
                  <Image style={{ transform: `scale(${previewScale[model]})` }} src={`/product-previews/${model}.png`} alt={`${model} bản thử chuẩn hóa`} fill sizes="(max-width: 700px) 45vw, 24vw" />
                </div>
              </figure>
            </div>
            <p className={styles.note}>{["dealan", "molino"].includes(model) ? "Giữ góc nghiêng gốc. Cần bổ sung ảnh chính diện đúng mẫu để đồng bộ góc chụp." : "Giữ góc chụp gốc; đối chiếu màu tròng và chi tiết gọng với ảnh bên trái."}</p>
          </article>
        ))}
      </div>
      <section id="collection" className={styles.collection}>
        <h2>Cả bộ sau xử lý</h2>
        <div className={styles.grid}>
          {models.map((model) => (
            <figure key={model}>
              <div className={styles.photo}>
                <Image style={{ transform: `scale(${previewScale[model]})` }} src={`/product-previews/${model}.png`} alt={`Jacques Marie Mage ${model}`} fill sizes="(max-width: 700px) 45vw, 24vw" />
              </div>
              <figcaption>{model.replaceAll("-", " ").toUpperCase()}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}
