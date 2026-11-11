#!/usr/bin/env sh
set -eu

# Build with isolated public test values. NEXT_PUBLIC_* variables are embedded
# into the bundle at build time; fake Firebase values keep the browser suite's
# network interception self-contained and cannot authenticate to a real project.
export NEXT_PUBLIC_API_BASE_URL='http://127.0.0.1:8080'
export NEXT_PUBLIC_APP_NAME='C1RCLE Partner Dashboard'
export NEXT_PUBLIC_ENVIRONMENT='development'
export NEXT_PUBLIC_APP_ID='partner'
export NEXT_PUBLIC_FIREBASE_API_KEY='e2e-firebase-api-key'
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN='e2e.firebaseapp.com'
export NEXT_PUBLIC_FIREBASE_PROJECT_ID='e2e'

pnpm build
pnpm exec playwright test "$@"
