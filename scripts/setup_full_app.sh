#!/usr/bin/env bash
set +e
trap 'code=$?; echo; echo "--- FIN (code $code) ---"; read -p "Appuie sur Entrée pour fermer..."; exit $code' EXIT

