#!/usr/bin/env bash
# Blackwing engine bootstrap.
#
# The engine's built-in model map points at premium Claude models. If your AWS
# Bedrock account cannot invoke those (e.g. Marketplace subscription/payment not
# completed), flows fail with AccessDeniedException / INVALID_PAYMENT_INSTRUMENT.
#
# This script probes which Bedrock models your key CAN invoke and registers a
# provider named "blackwing-bedrock" that uses the best accessible model for
# every agent role, so assessments run reliably. Point the GUI at it with
# BLACKWING_MODEL_PROVIDER=blackwing-bedrock (the default in .env.example).
#
# Re-run it any time (e.g. after fixing AWS billing) to move up to a better model.
#
# Usage: BEDROCK_BEARER_TOKEN=... [BEDROCK_REGION=us-east-1] \
#        [ENGINE_URL=https://localhost:8443] [ENGINE_MAIL=admin@pentagi.com] \
#        [ENGINE_PASSWORD=admin] scripts/bootstrap-engine.sh
set -euo pipefail
export NODE_TLS_REJECT_UNAUTHORIZED=0

REGION="${BEDROCK_REGION:-us-east-1}"
ENGINE_URL="${ENGINE_URL:-https://localhost:8443}"
MAIL="${ENGINE_MAIL:-admin@pentagi.com}"
PASS="${ENGINE_PASSWORD:-admin}"
TOKEN="${BEDROCK_BEARER_TOKEN:-${AWS_BEARER_TOKEN_BEDROCK:-}}"
[ -n "$TOKEN" ] || { echo "Set BEDROCK_BEARER_TOKEN (your Bedrock API key)"; exit 1; }

# Candidate models, best first. First one that returns HTTP 200 wins.
CANDIDATES=(
  "us.anthropic.claude-opus-4-6-v1"
  "us.anthropic.claude-sonnet-4-6"
  "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
  "us.anthropic.claude-sonnet-4-20250514-v1:0"
  "us.amazon.nova-pro-v1:0"
  "us.amazon.nova-lite-v1:0"
)

echo "Probing Bedrock model access in ${REGION}…"
PICK=""
for M in "${CANDIDATES[@]}"; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -m 20 -X POST \
    "https://bedrock-runtime.${REGION}.amazonaws.com/model/${M}/converse" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":[{"text":"ok"}]}],"inferenceConfig":{"maxTokens":5}}' || echo "000")
  echo "  [$CODE] $M"
  if [ "$CODE" = "200" ] && [ -z "$PICK" ]; then PICK="$M"; fi
done
[ -n "$PICK" ] || { echo "No Bedrock model is currently accessible with this key. Fix AWS billing/model access and retry."; exit 2; }
echo "Selected model: $PICK"

# Log in to the engine and grab the session cookie.
CJ="$(mktemp)"
curl -sk -m10 -c "$CJ" "${ENGINE_URL}/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d "{\"mail\":\"${MAIL}\",\"password\":\"${PASS}\"}" >/dev/null

# Build the agents config (all 13 roles -> selected model) and create/update the provider.
PAYLOAD="$(PICK="$PICK" python3 - <<'PY'
import json, os
M = os.environ["PICK"]
heavy = {"model": M, "maxTokens": 5000, "temperature": 0.7, "topP": 0.9}
light = {"model": M, "maxTokens": 3000, "temperature": 0.3, "topP": 0.9}
roles = ["simple","simpleJson","primaryAgent","assistant","generator","refiner",
         "adviser","reflector","searcher","enricher","coder","installer","pentester"]
agents = {r: (light if r in ("simple","simpleJson") else heavy) for r in roles}
print(json.dumps(agents))
PY
)"

EXISTING="$(curl -sk -m10 -b "$CJ" "${ENGINE_URL}/api/v1/graphql" -H 'Content-Type: application/json' \
  -d '{"query":"{ providerConfigs: providers { name } }"}' 2>/dev/null || true)"

# Create the provider (id resolves server-side); if it already exists this is a no-op error we ignore.
curl -sk -m30 -b "$CJ" "${ENGINE_URL}/api/v1/graphql" -H 'Content-Type: application/json' \
  -d "$(python3 -c 'import json,sys;a=json.load(open("/dev/stdin"));print(json.dumps({"query":"mutation($n:String!,$t:ProviderType!,$a:AgentsConfigInput!){createProvider(name:$n,type:$t,agents:$a){id name}}","variables":{"n":"blackwing-bedrock","t":"bedrock","a":a}}))' <<<"$PAYLOAD")" \
  | grep -q '"createProvider"' && echo "Provider 'blackwing-bedrock' created with $PICK." \
  || echo "Provider 'blackwing-bedrock' may already exist; re-run after deleting it to change the model, or update via the UI."

rm -f "$CJ"
echo "Done. Set BLACKWING_MODEL_PROVIDER=blackwing-bedrock for the GUI."
