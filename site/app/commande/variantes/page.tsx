import { Suspense } from "react";
import ChoixVariantes from "./ChoixVariantes";

export const metadata = { title: "Choisissez vos personnages" };

export default function Page() {
  return (
    <Suspense>
      <ChoixVariantes />
    </Suspense>
  );
}
