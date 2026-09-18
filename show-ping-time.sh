#!/bin/bash

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
# SPDX-License-Identifier: GPL-2.0-or-later

IP_WAN="8.8.8.8"
RESOLVE_DOMAIN="google.com"
CHECK_DNS=1

fail() {
  echo "Error: $*" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --ip)
      [ "$#" -ge 2 ] && [ -n "$2" ] || fail "Missing value for $1"
      IP_WAN="$2"
      shift 2
      ;;
    --domain)
      [ "$#" -ge 2 ] && [ -n "$2" ] || fail "Missing value for $1"
      RESOLVE_DOMAIN="$2"
      shift 2
      ;;
    --skip-dns)
      CHECK_DNS=0
      shift
      ;;
    --)
      shift
      break
      ;;
    -* )
      fail "Unknown option: $1"
      ;;
    *)
      fail "Unexpected argument: $1"
      ;;
  esac
done

PING_WAN=$(ping -4 -c 1 -W 5 ${IP_WAN}|head -n 2|tail -n 1|rev|cut -f 2 -d " " |rev|cut -f 2 -d "=")

if [ "${PING_WAN}" = "" ]; then
    RESULT="[ No internet connection ]"
else
    # Check DNS
  if [ "${CHECK_DNS}" -eq 1 ] && [ "$(host -R3 -4 -t A ${RESOLVE_DOMAIN} |grep address)" = "" ];then
        RESULT="[ DNS Problem ]"
    else
  	    RESULT="${PING_WAN}ms"
    fi
fi

echo -n "${RESULT}"
exit 0
