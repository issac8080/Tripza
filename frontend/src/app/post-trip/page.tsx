import Link from "next/link";
import { PostTripForm } from "./post-trip-form";

export default function PostTripPage() {
  return (
    <main className="page-wrap">
      <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Post a trip</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        Add where you are going, when, seats, and an optional price. People contact you by phone or WhatsApp—log in to publish.
      </p>
      <Link
        href="/trips"
        className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-brand-primary underline-offset-2 hover:underline"
      >
        View trip board →
      </Link>
      <div className="mt-8">
        <PostTripForm />
      </div>
      </div>
    </main>
  );
}
