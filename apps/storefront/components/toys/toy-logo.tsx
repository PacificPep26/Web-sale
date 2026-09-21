import Image from "next/image"
import Link from "next/link"

export function ToyLogo() {
  return <Link href="/" className="pp-logo" aria-label="PlayPuff home"><Image src="/playpuff/logo.webp" alt="PlayPuff" width={1000} height={229} priority /></Link>
}
