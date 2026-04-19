export type MainNavItem = {
  href: string;
  label: string;
  /** Short hint under label on desktop */
  hint?: string;
};

export const MAIN_NAV: MainNavItem[] = [
  { href: "/", label: "Home", hint: "Overview" },
  { href: "/vehicles", label: "Vehicles", hint: "Browse listings" },
  { href: "/trips", label: "Trips", hint: "Shared rides" },
  { href: "/activity", label: "Activity", hint: "Inbox & trips" },
  { href: "/my-trips", label: "My trips", hint: "Posted by you" },
  { href: "/provider/vehicles/new", label: "Add Vehicle", hint: "List yours" },
  { href: "/post-trip", label: "Post Trip", hint: "Offer seats" },
  { href: "/profile", label: "Profile", hint: "Account" },
];

export function navPathMatches(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
