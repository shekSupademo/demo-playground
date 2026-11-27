import { createContext, type ReactNode, useContext, useState } from "react";
import { daysFromToday } from "../../kit";
import {
  type DevApp,
  type Member,
  seedApps,
  seedDomains,
  seedMembers,
  seedTeams,
  type Team,
} from "./data";

function useStoreValue(v: boolean, toast: (message: string) => void) {
  const [members, setMembers] = useState(seedMembers);
  const [teams, setTeams] = useState(seedTeams);
  const [apps, setApps] = useState(seedApps);
  const [domains, setDomains] = useState(seedDomains);

  return {
    v,
    toast,
    members,
    teams,
    apps,
    domains,
    resetTwoFactor(member: Member) {
      setMembers((all) =>
        all.map((x) =>
          x.id === member.id ? { ...x, twoFactor: "Not enrolled" } : x,
        ),
      );
      toast(`2-step verification reset for ${member.name}`);
    },
    setLimit(team: Team, limitGb: number) {
      setTeams((all) =>
        all.map((x) => (x.id === team.id ? { ...x, limitGb } : x)),
      );
      toast(`Storage limit updated to ${limitGb} GB for ${team.name}`);
    },
    rotateKey(app: DevApp, keyId: string) {
      const suffix = Math.random().toString(16).slice(2, 6).padEnd(4, "0");
      setApps((all) =>
        all.map((a) =>
          a.id === app.id
            ? {
                ...a,
                keys: a.keys.map((k) =>
                  k.id === keyId
                    ? { ...k, suffix, rotated: daysFromToday(0) }
                    : k,
                ),
              }
            : a,
        ),
      );
      toast(`${app.keys.find((k) => k.id === keyId)?.name} rotated`);
    },
    addDomain(name: string) {
      setDomains((all) => [
        ...all,
        { name, added: daysFromToday(0), verified: false },
      ]);
      toast(`${name} added`);
    },
  };
}

type Store = ReturnType<typeof useStoreValue>;

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({
  v,
  toast,
  children,
}: {
  v: boolean;
  toast: (m: string) => void;
  children: ReactNode;
}) {
  return (
    <StoreContext.Provider value={useStoreValue(v, toast)}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore needs StoreProvider");
  return store;
}
