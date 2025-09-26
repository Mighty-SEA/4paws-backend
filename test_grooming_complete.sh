#!/usr/bin/env bash
set -euo pipefail

# Simple end-to-end test: create booking (Grooming), create examination, set COMPLETED, verify
# Usage (all optional, defaults = 1):
#   OWNER_ID=1 SERVICE_TYPE_ID=1 PET_ID=1 BASE=http://localhost:3200 ./test_grooming_complete.sh

BASE_URL="${BASE:-http://localhost:3200}"
OWNER_ID="${OWNER_ID:-1}"
SERVICE_TYPE_ID="${SERVICE_TYPE_ID:-1}"
PET_ID="${PET_ID:-1}"

command -v jq >/dev/null 2>&1 || {
  echo "jq is required. Please install jq (sudo apt install jq)" >&2
  exit 1
}

echo "1) Login as admin"
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin12345"}' | jq -r .access_token)
if [[ -z "${TOKEN}" || "${TOKEN}" == "null" ]]; then
  echo "Failed to login. Check backend auth endpoint and credentials." >&2
  exit 1
fi
echo "   OK"

echo "2) Create booking (ownerId=$OWNER_ID, serviceTypeId=$SERVICE_TYPE_ID, petIds=[$PET_ID])"
BID=$(curl -s -X POST "$BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"ownerId\":$OWNER_ID,\"serviceTypeId\":$SERVICE_TYPE_ID,\"petIds\":[$PET_ID]}" | jq -r .id)
if [[ -z "${BID}" || "${BID}" == "null" ]]; then
  echo "Failed to create booking" >&2
  exit 1
fi
echo "   Booking ID: $BID"

echo "3) Get bookingPetId"
BPID=$(curl -s "$BASE_URL/bookings/$BID" -H "Authorization: Bearer $TOKEN" | jq -r '.pets[0].id')
if [[ -z "${BPID}" || "${BPID}" == "null" ]]; then
  echo "No bookingPet found on the booking (did you pass a valid PET_ID?)" >&2
  exit 1
fi
echo "   BookingPet ID: $BPID"

echo "4) Create examination (no products)"
EXID=$(curl -s -X POST "$BASE_URL/bookings/$BID/pets/$BPID/examinations" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"notes":"API Grooming test","products":[]}' | jq -r .id)
if [[ -z "${EXID}" || "${EXID}" == "null" ]]; then
  echo "Failed to create examination" >&2
  exit 1
fi
echo "   Examination ID: $EXID"

echo "5) Set booking status COMPLETED"
NEW_STATUS=$(curl -s -X PATCH "$BASE_URL/bookings/$BID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"COMPLETED"}' | jq -r .status)
echo "   Patch status -> $NEW_STATUS"

echo "6) Verify status"
CUR_STATUS=$(curl -s "$BASE_URL/bookings/$BID" -H "Authorization: Bearer $TOKEN" | jq -r .status)
echo "   Current status: $CUR_STATUS"

if [[ "$CUR_STATUS" == "COMPLETED" ]]; then
  echo "SUCCESS: Booking $BID is COMPLETED"
  exit 0
else
  echo "FAILED: Booking $BID status is $CUR_STATUS (expected COMPLETED)" >&2
  exit 2
fi


