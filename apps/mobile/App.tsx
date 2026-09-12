import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";

import type { EmailAuthClient } from "./src/lib/auth";
import type { FeedClient } from "./src/lib/feed";
import { MOBILE_COPY } from "./src/lib/product";
import { createMobileClient, readExpoSurvivorEnv } from "./src/lib/supabase";
import { survivorEnvReady } from "./src/lib/survivor-env";
import { tokens } from "./src/lib/tokens";
import { HomeScreen } from "./src/screens/home-screen";
import { SignInScreen } from "./src/screens/sign-in-screen";

export default function App() {
  const env = useMemo(() => readExpoSurvivorEnv(), []);
  const client = useMemo(() => (survivorEnvReady(env) ? createMobileClient(env) : null), [env]);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!client) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void client.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session);
        setReady(true);
      }
    });
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [client]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={tokens.accent} />
        <StatusBar style="dark" />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.boot}>
        <Text style={styles.missing}>{MOBILE_COPY.missingEnv}</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {session ? (
        <HomeScreen
          client={client as EmailAuthClient & FeedClient}
          email={session.user.email ?? ""}
          userId={session.user.id}
        />
      ) : (
        <SignInScreen client={client} />
      )}
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.bg,
  },
  boot: {
    flex: 1,
    backgroundColor: tokens.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space6,
  },
  missing: {
    color: tokens.body,
    fontSize: 15,
    textAlign: "center",
  },
});
