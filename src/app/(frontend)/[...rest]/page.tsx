import { notFound } from 'next/navigation'

/** Sends every unmatched public URL to the branded 404 (keeps the site layout). */
export default function CatchAll() {
  notFound()
}
