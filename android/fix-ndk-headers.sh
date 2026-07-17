#!/usr/bin/env bash
# Patches bionic NDK headers that use uint32_t/int64_t etc. without first
# including <stdint.h>. Affects NDK r25 / r26b / r27 (sysroot in
# $ANDROID_HOME/ndk/<ver>/toolchains/llvm/prebuilt/linux-x86_64/sysroot).
# This is a known compatibility fix; the same header content exists in
# NDK r26c and later without these patches.
set -euo pipefail

NDK_ROOT="${ANDROID_HOME:-$HOME/Android/Sdk}/ndk"
if [ ! -d "$NDK_ROOT" ]; then
    echo "No NDK root at $NDK_ROOT; nothing to patch."
    exit 0
fi

for ndk in "$NDK_ROOT"/*/toolchains/llvm/prebuilt/linux-x86_64/sysroot; do
    [ -d "$ndk" ] || continue
    for rel in usr/include/sys/types.h usr/include/bits/pthread_types.h; do
        f="$ndk/$rel"
        [ -f "$f" ] || continue
        if [ "$rel" = "usr/include/sys/types.h" ]; then
            if ! grep -q '^#include <stdint.h>$' "$f"; then
                # Insert right after the header guard define
                python3 - "$f" <<'PY'
import sys, pathlib
p = pathlib.Path(sys.argv[1])
text = p.read_text()
text = text.replace('#define _SYS_TYPES_H_',
                    '#define _SYS_TYPES_H_\n\n#include <stdint.h>', 1)
p.write_text(text)
PY
                echo "patched $f"
            fi
        else
            if ! head -1 "$f" | grep -q '^#include <stdint.h>$'; then
                python3 - "$f" <<'PY'
import sys, pathlib
p = pathlib.Path(sys.argv[1])
text = p.read_text()
p.write_text('#include <stdint.h>\n' + text)
PY
                echo "patched $f"
            fi
        fi
    done
done
