#!/bin/sh
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://127.0.0.1:${VOZ_PC_PORT:-9847}/ptt/toggle"
