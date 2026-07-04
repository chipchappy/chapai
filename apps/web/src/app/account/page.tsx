import { redirect } from "next/navigation";

// /account is the path people guess; billing is the only account surface today.
export default function AccountPage() {
  redirect("/account/billing");
}
