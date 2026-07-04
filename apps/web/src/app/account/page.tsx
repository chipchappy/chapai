import { redirect } from "next/navigation";

// Must render at request time: a redirect() in a statically prerendered page
// degrades to a client-side meta refresh instead of an HTTP redirect.
export const dynamic = "force-dynamic";

// /account is the path people guess; billing is the only account surface today.
export default function AccountPage() {
  redirect("/account/billing");
}
