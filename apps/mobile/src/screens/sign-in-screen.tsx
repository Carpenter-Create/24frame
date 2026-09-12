import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  normalizeEmail,
  requestEmailCode,
  verifyEmailCode,
  type EmailAuthClient,
} from "../lib/auth";
import { MOBILE_COPY, PRODUCT_NAME, PRODUCT_WORKSPACES } from "../lib/product";
import { tokens } from "../lib/tokens";

export function SignInScreen({ client }: { client: EmailAuthClient }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSendCode() {
    setPending(true);
    setMessage(null);
    const result = await requestEmailCode(client, email);
    setPending(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setAwaitingCode(true);
  }

  async function onVerify() {
    setPending(true);
    setMessage(null);
    const result = await verifyEmailCode(client, email, code);
    setPending(false);
    if (!result.ok) setMessage(result.message);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.wordmark}>{PRODUCT_NAME}</Text>
      <Text style={styles.workspace}>{PRODUCT_WORKSPACES}</Text>
      <Text style={styles.title}>{MOBILE_COPY.signInTitle}</Text>
      <Text style={styles.body}>{MOBILE_COPY.signInBody}</Text>

      {!awaitingCode ? (
        <>
          <Text style={styles.label}>{MOBILE_COPY.emailLabel}</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder={MOBILE_COPY.emailPlaceholder}
            placeholderTextColor={tokens.textTertiary}
            style={styles.input}
            value={email}
          />
          <Pressable
            disabled={pending || !normalizeEmail(email)}
            onPress={() => void onSendCode()}
            style={[styles.button, pending && styles.buttonDisabled]}
          >
            {pending ? (
              <ActivityIndicator color={tokens.accentContrast} />
            ) : (
              <Text style={styles.buttonLabel}>{MOBILE_COPY.sendCode}</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>{MOBILE_COPY.codeLabel}</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="number-pad"
            onChangeText={setCode}
            placeholder={MOBILE_COPY.codePlaceholder}
            placeholderTextColor={tokens.textTertiary}
            style={styles.input}
            value={code}
          />
          <Pressable
            disabled={pending}
            onPress={() => void onVerify()}
            style={[styles.button, pending && styles.buttonDisabled]}
          >
            {pending ? (
              <ActivityIndicator color={tokens.accentContrast} />
            ) : (
              <Text style={styles.buttonLabel}>{MOBILE_COPY.verifyCode}</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              setAwaitingCode(false);
              setCode("");
              setMessage(null);
            }}
          >
            <Text style={styles.link}>{MOBILE_COPY.useDifferentEmail}</Text>
          </Pressable>
        </>
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: tokens.bg,
    paddingHorizontal: tokens.space6,
    paddingTop: tokens.space8,
    gap: tokens.space3,
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
  },
  title: {
    marginTop: tokens.space4,
    color: tokens.text,
    fontSize: 22,
    fontWeight: "600",
  },
  body: {
    color: tokens.body,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    marginTop: tokens.space2,
    color: tokens.textSecondary,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.border,
    backgroundColor: tokens.surface,
    borderRadius: tokens.radius,
    paddingHorizontal: tokens.space4,
    paddingVertical: tokens.space3,
    color: tokens.text,
    fontSize: 16,
  },
  button: {
    marginTop: tokens.space2,
    backgroundColor: tokens.accent,
    borderRadius: tokens.radius,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: tokens.accentContrast,
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    color: tokens.accent,
    fontSize: 14,
  },
  message: {
    color: tokens.body,
    fontSize: 14,
  },
});
