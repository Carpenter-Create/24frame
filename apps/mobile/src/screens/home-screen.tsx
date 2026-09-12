import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { signOutSession, type EmailAuthClient } from "../lib/auth";
import { accountInitials, initialsFromEmail } from "../lib/faces";
import { loadSocialHome, type FeedClient, type SocialHome } from "../lib/feed";
import { MOBILE_COPY, PRODUCT_NAME, PRODUCT_WORKSPACES, SOCIAL_EDUCATION_WORKSPACE } from "../lib/product";
import { tokens } from "../lib/tokens";

export function HomeScreen({
  client,
  userId,
  email,
}: {
  client: EmailAuthClient & FeedClient;
  userId: string;
  email: string;
}) {
  const [home, setHome] = useState<SocialHome | null>(null);

  const refresh = useCallback(async () => {
    try {
      setHome(await loadSocialHome(client, userId));
    } catch {
      setHome({ profile: null, posts: [] });
    }
  }, [client, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const displayName = home?.profile?.display_name ?? email;
  const initials = home?.profile ? accountInitials(home.profile.display_name) : initialsFromEmail(email);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.wordmark}>{PRODUCT_NAME}</Text>
          <Text style={styles.workspace}>{PRODUCT_WORKSPACES}</Text>
          <Text style={styles.foothold}>{SOCIAL_EDUCATION_WORKSPACE}</Text>
        </View>
        <View style={styles.face}>
          <Text style={styles.faceLabel}>{initials}</Text>
        </View>
      </View>
      <Text style={styles.homeTitle}>{MOBILE_COPY.signedInHome}</Text>
      <Text style={styles.who}>{displayName}</Text>

      {!home ? (
        <ActivityIndicator color={tokens.accent} style={styles.spinner} />
      ) : home.posts.length === 0 ? (
        <Text style={styles.empty}>{MOBILE_COPY.emptyFeed}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.feed}>
          {home.posts.map((post) => (
            <View key={post.id} style={styles.card}>
              <Text style={styles.author}>{post.authorName}</Text>
              <Text style={styles.postBody}>{post.body}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Pressable onPress={() => void signOutSession(client)} style={styles.signOut}>
        <Text style={styles.signOutLabel}>{MOBILE_COPY.signOut}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: tokens.bg,
    paddingHorizontal: tokens.space6,
    paddingTop: tokens.space8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmark: {
    color: tokens.text,
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  workspace: {
    color: tokens.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  foothold: {
    color: tokens.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  face: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.surface,
    borderWidth: 1,
    borderColor: tokens.border,
    alignItems: "center",
    justifyContent: "center",
  },
  faceLabel: {
    color: tokens.text,
    fontSize: 13,
    fontWeight: "600",
  },
  homeTitle: {
    marginTop: tokens.space6,
    color: tokens.text,
    fontSize: 22,
    fontWeight: "600",
  },
  who: {
    marginTop: tokens.space2,
    color: tokens.textSecondary,
    fontSize: 14,
  },
  spinner: {
    marginTop: tokens.space8,
  },
  empty: {
    marginTop: tokens.space8,
    color: tokens.body,
    fontSize: 15,
  },
  feed: {
    paddingTop: tokens.space4,
    paddingBottom: tokens.space8,
    gap: tokens.space3,
  },
  card: {
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    borderWidth: 1,
    borderRadius: tokens.radius,
    padding: tokens.space4,
    gap: tokens.space2,
  },
  author: {
    color: tokens.text,
    fontSize: 14,
    fontWeight: "600",
  },
  postBody: {
    color: tokens.body,
    fontSize: 15,
    lineHeight: 22,
  },
  signOut: {
    marginTop: "auto",
    marginBottom: tokens.space8,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutLabel: {
    color: tokens.accent,
    fontSize: 15,
    fontWeight: "600",
  },
});
