import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { site } from "@/content/site";

// Email clients ignore most CSS, so the retro look here is flat colors only.
const c = {
  night: "#150f2e",
  panel: "#221850",
  cream: "#fff3dc",
  muted: "#b9aee0",
  sun: "#ff5e3a",
  gold: "#ffc247",
  teal: "#2de2c8",
};

export function Shell({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: c.night, margin: 0, padding: "24px 12px", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 520, backgroundColor: c.panel, borderRadius: 20, border: `2px solid ${c.sun}`, padding: "32px 28px" }}>
          <Text style={{ color: c.teal, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", margin: 0, fontFamily: "Courier New, monospace" }}>
            {site.country} · {site.dateLabel}
          </Text>
          <Heading as="h1" style={{ color: c.gold, fontSize: 34, lineHeight: "38px", margin: "8px 0 20px" }}>
            {site.title}
          </Heading>
          {children}
          <Hr style={{ borderColor: "#3b2f7a", margin: "28px 0 16px" }} />
          <Text style={{ color: c.muted, fontSize: 12, lineHeight: "18px", margin: 0 }}>
            You&apos;re getting this because {site.host} invited you to his 40th birthday. Just reply to
            this email if you have questions.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <Text style={{ color: c.cream, fontSize: 16, lineHeight: "25px", margin: "0 0 16px" }}>{children}</Text>;
}

export function Cta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "24px 0 8px" }}>
      <Button
        href={href}
        style={{ backgroundColor: c.sun, color: c.night, fontWeight: 700, fontSize: 16, padding: "14px 26px", borderRadius: 999 }}
      >
        {children}
      </Button>
    </Section>
  );
}

export function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <Section style={{ backgroundColor: c.night, borderRadius: 12, padding: "14px 18px", margin: "0 0 16px" }}>
      {rows.map(([label, value]) => (
        <Text key={label} style={{ color: c.cream, fontSize: 15, lineHeight: "22px", margin: "4px 0" }}>
          <span style={{ color: c.teal, fontFamily: "Courier New, monospace", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
            {label}
          </span>
          <br />
          {value}
        </Text>
      ))}
    </Section>
  );
}
