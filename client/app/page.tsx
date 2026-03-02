"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Zap, CheckCircle2, Shield, Mail, Server, Trash2,
  ArrowRight, Code2, TrendingUp, Globe, Star, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const features = [
  {
    icon: Mail,
    title: "Syntax Validation",
    description: "Instantly verify email format against RFC 5322 standards with sub-millisecond response times.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Server,
    title: "MX Record Lookup",
    description: "Real-time DNS MX record validation to ensure the domain can receive email.",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: Trash2,
    title: "Disposable Detection",
    description: "Block temporary and throwaway email addresses from 4,000+ known disposable providers.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Shield,
    title: "Trust Scoring",
    description: "Get a 0–100 trust score for every email combining all checks into a single signal.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Code2,
    title: "Developer-First API",
    description: "RESTful JSON API with simple key-based auth. Get started in under 5 minutes.",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    icon: TrendingUp,
    title: "Usage Analytics",
    description: "Track verification volume, error rates, and API performance from your dashboard.",
    color: "bg-orange-500/10 text-orange-600",
  },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for side projects and testing.",
    features: [
      "5,000 verifications/month",
      "3 API keys",
      "Syntax + MX checks",
      "Basic disposable detection",
      "Community support",
    ],
    cta: "Get started free",
    href: "/auth/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For teams with serious email deliverability needs.",
    features: [
      "100,000 verifications/month",
      "Unlimited API keys",
      "Advanced disposable detection",
      "Bulk verification",
      "Webhooks",
      "Priority support",
      "SLA guarantee",
    ],
    cta: "Start Pro trial",
    href: "/auth/signup",
    highlighted: true,
  },
];

const codeSnippet = `// Verify an email with VeriMail
const res = await fetch(
  "https://api.verimail.io/v1/email/verify?email=user@example.com",
  { headers: { "x-api-key": "vm_sk_..." } }
);

const data = await res.json();
// {
//   valid: true,
//   format_valid: true,
//   mx_found: true,
//   disposable: false,
//   score: 96
// }`;

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">VeriMail</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-foreground transition-colors">Docs</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="gap-1.5">
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-36 pb-24 grid-bg relative overflow-hidden">

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-6 gap-1.5 px-3 py-1.5 text-sm">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                Trusted by 2,000+ developers
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight"
            >
              Email verification
              <br />
              <span className="gradient-text">done right.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
            >
              Stop bounces before they happen. VeriMail validates syntax, MX records,
              and disposable addresses in real-time via a simple REST API.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="xl" className="gap-2 shadow-lg hover:shadow-primary/20">
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="xl" variant="outline">
                  See how it works
                </Button>
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-4 text-xs text-muted-foreground">
              No credit card required · 5,000 free checks/month
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">verify.js</span>
              </div>
              <pre className="p-6 text-sm font-mono overflow-x-auto">
                <code className="text-foreground/85">{codeSnippet}</code>
              </pre>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 border-y border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest font-medium mb-8">
            Used by teams at
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap opacity-40">
            {["Stripe", "Vercel", "Linear", "Notion", "Figma"].map((name) => (
              <span key={name} className="font-display font-bold text-lg text-foreground">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <Section className="text-center mb-16">
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-4">Features</Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-display font-bold">
              Everything you need to verify emails
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-lg mx-auto">
              A comprehensive suite of checks to improve deliverability and protect your sender reputation.
            </motion.p>
          </Section>

          <Section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                <Card className="h-full hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-semibold text-base mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Section>
        </div>
      </section>

      <section className="py-24 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6">
          <Section className="text-center mb-16">
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-4">How it works</Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-display font-bold">
              Three steps to cleaner email lists
            </motion.h2>
          </Section>
          <Section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Sign up & get your key", desc: "Create a free account and generate your first API key in seconds.", icon: Zap },
              { step: "02", title: "Make an API request", desc: "Send a GET request with the email and your API key. That's it.", icon: Code2 },
              { step: "03", title: "Act on the results", desc: "Use the validity flag, trust score, and checks to make smart decisions.", icon: CheckCircle2 },
            ].map((step, i) => (
              <motion.div key={step.step} variants={fadeUp} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 font-display text-xs font-bold text-primary/40">{step.step}</span>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute right-0 top-7 translate-x-1/2 text-muted-foreground/30">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </Section>
        </div>
      </section>

      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <Section className="text-center mb-16">
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-4">Pricing</Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-display font-bold">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
              Start free. Upgrade when you need more.
            </motion.p>
          </Section>

          <Section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {pricing.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`relative h-full ${plan.highlighted ? "border-primary shadow-lg shadow-primary/10" : ""}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 shadow">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <p className="font-display font-bold text-lg">{plan.name}</p>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-display font-bold">{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                    </div>

                    <ul className="space-y-2.5 mb-8">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link href={plan.href} className="block">
                      <Button
                        className="w-full"
                        variant={plan.highlighted ? "default" : "outline"}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Section>
        </div>
      </section>

      <section className="py-24 bg-primary">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Section>
            <motion.h2 variants={fadeUp} className="text-4xl font-display font-bold text-primary-foreground">
              Start verifying emails today.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-primary-foreground/70 text-lg">
              Join thousands of developers building better email workflows.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8">
              <Link href="/auth/signup">
                <Button size="xl" variant="secondary" className="gap-2">
                  Create free account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </Section>
        </div>
      </section>
      
    </div>
  );
}
