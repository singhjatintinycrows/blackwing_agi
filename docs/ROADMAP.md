# Blackwing — Requirements, Status, Known Issues & Prerequisites

Tracks the client requirements from the 7 Sep 2026 MoM (*BlackWing – Enhancement,
Assessment Workflow & Reporting*) against the current build, plus known issues and
the prerequisites for running an assessment.

## Requirement status (MoM)

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Report formatting & quality | **Done (baseline)** | Two report templates matching Tinycrows' own PDFs: **Website Assessment / Grey Box Pentesting** (web) and **AI Red Teaming** (AI/LLM). Exec summary, severity counts, OWASP/CWE mapping, per-finding blocks (overview, impact, CVSS score+vector, affected location, steps-to-reproduce, remediation, references). |
| 5 | Consistent assessment ↔ UI reflection | **Done (baseline)** | The GUI streams the engine's real activity live (STATUS/THINK/FINDING incl. terminal output & tool calls); findings + reports persist and show in the UI. |
| 9 | End-to-end assessment via Web UI | **Done (baseline)** | Configure → run → watch live → findings → download report, no terminal. |
| 2 | Recon → assessment mapping | **In progress** | Thread discovered assets/technologies/attack surface from the recon phase into the report's scope/methodology and per-finding "affected location". |
| 3 | PoC functionality | **In progress** | Capture the engine's tool evidence (requests/responses, command output) into each finding's PoC/steps-to-reproduce, redacted as required. |
| 4 | Vulnerability management dashboard | **In progress** | Extend the Vulnerabilities view: status workflow (open/confirmed/remediated/accepted), retest tracking, severity/risk posture, filters. |
| 8 | False-positive reduction | **In progress** | Reproduction/validation gating before a candidate is recorded as "confirmed" (the `--validate-findings` path); correlate multiple signals. |
| 10 | Token & time analysis | **Planned** | The engine already records usage/toolcall/flow stats (GraphQL `usageStats*`, `toolcallsStats*`) — surface per-assessment token cost and stage durations in the UI. |
| 6 | Bug identification & recommendations | **This document** | See "Known issues" below. |
| 7 | Assessment prerequisites | **This document** | See "Prerequisites" below. |
| 11 | Internal traffic + latest zero-days | **Planned** | Keep engine traffic internal; wire threat-intel/zero-day feeds (the engine supports search providers + a knowledge graph) into recon. |

## Known issues (found during bring-up)

1. **AWS Bedrock model access / billing.** With account `825047614247`, all Claude
   models return `AccessDeniedException: INVALID_PAYMENT_INSTRUMENT` (Marketplace
   subscription/payment not completed). Only Amazon Nova + `gpt-oss-120b` are
   invokable. **Recommendation:** add a valid payment instrument and complete the
   Bedrock model subscriptions, then set `BLACKWING_MODEL_PROVIDER=bedrock` (or
   re-run `scripts/bootstrap-engine.sh`) to use Claude. Until then the tool runs on
   Nova Pro via the `blackwing-bedrock` provider.
2. **Model quality on Nova Pro.** Nova occasionally mis-formats tool arguments
   (e.g. passing `https://host` into `nmap`, which expects a bare host) and can hit
   command timeouts, reducing coverage. Claude resolves most of this — priority is
   restoring Claude access (issue 1).
3. **First scan latency.** The first pentest flow pulls the Kali tools image
   (~14.6 GB) once; subsequent scans reuse it.
4. **Report finding numbering** uses a flat `N.` scheme vs the sample's `N.N`;
   cosmetic, to align.

## Prerequisites for an assessment

- **Authorised target only.** A URL you own or have written authorisation to test.
  The engine launches real tools (nmap, nuclei, sqlmap, …) against the target.
- **An invokable model.** A Bedrock key whose account can call a capable model
  (Claude preferred; Nova as fallback). See issue 1.
- **Scope & type.** Target URL, in-scope paths, and (optionally) auth/credentials
  for grey-box testing. Type (web vs AI) is auto-detected; override if needed.
- **Resources.** Docker + ~4 GB RAM; outbound network from the engine to the target.

## Next steps (priority order)

1. Restore Claude access (billing) → far better assessments.
2. Recon→report correlation (#2) and PoC/evidence capture (#3).
3. Vulnerability dashboard (#4) and false-positive gating (#8).
4. Token/time telemetry in the UI (#10); threat-intel/zero-day feeds (#11).
